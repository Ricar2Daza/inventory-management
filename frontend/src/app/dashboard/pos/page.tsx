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
        <div className="pos-container" style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            padding: '1rem',
            height: 'calc(100vh - 120px)',
            minHeight: '600px'
        }}>
            {/* Lado Izquierdo: Productos */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <input
                        type="search"
                        placeholder="🔍 Buscar por nombre o SKU..."
                        className="input"
                        style={{ fontSize: '1.1rem' }}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: 'var(--bg-color)' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            Cargando...
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '0.75rem'
                        }}>
                            {filteredProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p)}
                                    disabled={p.current_stock <= 0}
                                    className="card"
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        padding: '0.75rem',
                                        opacity: p.current_stock <= 0 ? 0.5 : 1,
                                        cursor: p.current_stock <= 0 ? 'not-allowed' : 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{p.sku}</span>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: '999px',
                                                backgroundColor: p.current_stock > 0 ? 'var(--primary-light)' : 'var(--error-color)',
                                                color: p.current_stock > 0 ? 'var(--primary-color)' : 'white'
                                            }}>
                                                {p.current_stock > 0 ? `Stock: ${p.current_stock}` : 'Agotado'}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, height: '2.5rem', overflow: 'hidden' }}>{p.name}</h3>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)' }}>${p.unit_price}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Lado Derecho: Carrito/Ticket */}
            <div className="cart-sidebar" style={{
                width: '380px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--text-primary)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🛒 Venta Actual</h2>
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {cart.reduce((acc, i) => acc + i.quantity, 0)} items
                    </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.5 }}>
                            El carrito está vacío
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.product.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                borderBottom: '1px solid var(--border-color)',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                                    <h4 style={{ fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</h4>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                        ${item.product.unit_price} x {item.quantity}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                                        <button onClick={() => updateQuantity(item.product.id, -1)} style={{ padding: '0.1rem 0.4rem' }}>-</button>
                                        <span style={{ width: '1.5rem', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} style={{ padding: '0.1rem 0.4rem' }}>+</button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--error-color)', marginLeft: '0.25rem' }}>✕</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>Total a Pagar</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>${cartTotal.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || processing}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        {processing ? "Procesando..." : "💵 COBRAR"}
                    </button>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .pos-container {
                        flex-direction: column !important;
                        height: auto !important;
                    }
                    .cart-sidebar {
                        width: 100% !important;
                        margin-top: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}
