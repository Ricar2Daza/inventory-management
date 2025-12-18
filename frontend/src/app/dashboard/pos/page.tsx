"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

// Interfaces Locales
interface Product {
    id: number;
    name: string;
    sku: string;
    unit_price: number;
    current_stock: number;
    category?: { id: number; name: string };
    image_url?: string; // Futuro
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Cargar productos
    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Traer todos para velocidad en POS (o paginar si son miles)
                const { data } = await api.get("/products/?limit=500");
                const items = Array.isArray(data) ? data : data.items;
                setProducts(items);
                setFilteredProducts(items);
            } catch (error) {
                console.error("Error loading products", error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, []);

    // Filtrado local
    useEffect(() => {
        if (!searchTerm) {
            setFilteredProducts(products);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                p.sku.toLowerCase().includes(lower)
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    // Cart Logic
    const addToCart = (product: Product) => {
        if (product.current_stock <= 0) return; // No permitir si no hay stock

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                // Verificar stock maximo
                if (existing.quantity >= product.current_stock) {
                    alert("No hay más stock disponible de este producto.");
                    return prev;
                }
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return item; // Mínimo 1, usar eliminar para 0
                    if (newQty > item.product.current_stock) {
                        alert("Stock insuficiente.");
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            });
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.unit_price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!confirm(`¿Confirmar venta por $${cartTotal.toFixed(2)}?`)) return;

        setProcessing(true);
        try {
            const payload = {
                payment_method: "Efectivo", // Hardcoded v1
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                }))
            };

            const res = await api.post("/orders/", payload);
            alert(`✅ Venta #${res.data.id} registrada con éxito!`);
            setCart([]); // Limpiar carrito

            // Recargar productos para actualizar stock visual
            const { data } = await api.get("/products/?limit=500");
            const items = Array.isArray(data) ? data : data.items;
            setProducts(items);

        } catch (error: any) {
            console.error("Error checkout", error);
            alert("Error al procesar venta: " + (error.response?.data?.detail || "Error desconocido"));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4 p-4 font-sans text-gray-800 dark:text-gray-100">
            {/* Lado Izquierdo: Productos */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                    <input
                        type="search"
                        placeholder="🔍 Buscar por nombre o SKU..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-lg transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-slate-900">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.current_stock <= 0}
                                    className={`
                                        relative group flex flex-col justify-between p-4 rounded-xl border transition-all duration-200
                                        ${p.current_stock <= 0
                                            ? 'opacity-50 grayscale cursor-not-allowed bg-gray-200 dark:bg-slate-800'
                                            : 'bg-white dark:bg-slate-800 hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 cursor-pointer border-gray-200 dark:border-slate-700'}
                                    `}
                                >
                                    <div className="w-full text-left">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono font-bold text-gray-400 truncate">{p.sku}</span>
                                            {p.current_stock > 0 ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold">
                                                    Stock: {p.current_stock}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
                                                    Agotado
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-sm leading-tight mb-2 line-clamp-2 h-10">{p.name}</h3>
                                        <div className="text-xl font-black text-blue-600 dark:text-blue-400">${p.unit_price}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lado Derecho: Carrito/Ticket */}
            <div className="w-96 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700">
                <div className="p-4 bg-gray-900 text-white rounded-t-xl flex justify-between items-center">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        🛒 Venta Actual
                    </h2>
                    <span className="bg-white/20 px-2 py-1 rounded text-sm font-mono">
                        {cart.reduce((acc, i) => acc + i.quantity, 0)} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg group hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h4 className="font-semibold text-sm truncate">{item.product.name}</h4>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        ${item.product.unit_price} x {item.quantity}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <button
                                            onClick={() => updateQuantity(item.product.id, -1)}
                                            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-l-lg"
                                        >-</button>
                                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.product.id, 1)}
                                            className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-r-lg"
                                        >+</button>
                                    </div>
                                    <div className="font-bold w-16 text-right">
                                        ${(item.product.unit_price * item.quantity).toFixed(2)}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t dark:border-slate-700 rounded-b-xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500 font-medium uppercase text-sm">Total a Pagar</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-white">
                            ${cartTotal.toFixed(2)}
                        </span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all
                            ${cart.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0'}
                        `}
                    >
                        {processing ? "Procesando..." : "💵 COBRAR"}
                    </button>
                </div>
            </div>
        </div>
    );
}
