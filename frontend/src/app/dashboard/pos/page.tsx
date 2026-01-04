"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

// Interfaces Locales
interface Product {
    id: number;
    name: string;
    sku: string;
    unit_price: number;
    current_stock: number;
}

interface Client {
    id: number;
    name: string;
    balance: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // New Sale States
    const [selectedClientId, setSelectedClientId] = useState<number | "">("");
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");
    const [lastOrderId, setLastOrderId] = useState<number | null>(null);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [prodRes, clientRes] = await Promise.all([
                    api.get("/products/?limit=500"),
                    api.get("/clients/")
                ]);
                const prodItems = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.items;
                setProducts(prodItems);
                setFilteredProducts(prodItems);
                setClients(clientRes.data);
            } catch (error) {
                console.error("Error loading data", error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Filtrado local de productos
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

    const addToCart = (product: Product) => {
        if (product.current_stock <= 0) return;
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.current_stock) {
                    alert("Stock insuficiente.");
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.unit_price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const payload = {
                payment_method: paymentMethod,
                client_id: selectedClientId || null,
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                }))
            };

            const res = await api.post("/orders/", payload);
            setLastOrderId(res.data.id);
            setCart([]);
            setSelectedClientId("");
            setPaymentMethod("Efectivo");

            // Refresh stock
            const { data } = await api.get("/products/?limit=500");
            setProducts(Array.isArray(data) ? data : data.items);

            alert(`✅ Venta #${res.data.id} registrada con éxito!`);
        } catch (error: any) {
            alert("Error: " + (error.response?.data?.detail || "Error desconocido"));
        } finally {
            setProcessing(false);
        }
    };

    const downloadReceipt = async (orderId: number) => {
        try {
            const response = await api.get(`/orders/${orderId}/receipt`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `recibo_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error al descargar el recibo");
        }
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)' }}>
            {/* Lado Izquierdo: Productos */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <input
                        type="search"
                        placeholder="🔍 Buscar producto..."
                        className="input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                    {filteredProducts.map(p => (
                        <button key={p.id} onClick={() => addToCart(p)} disabled={p.current_stock <= 0} className="card" style={{ textAlign: 'left', opacity: p.current_stock <= 0 ? 0.5 : 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.sku}</div>
                            <h4 style={{ margin: '0.5rem 0', fontSize: '0.9rem' }}>{p.name}</h4>
                            <div style={{ fontWeight: 800, color: 'var(--primary-color)' }}>${p.unit_price}</div>
                            <div style={{ fontSize: '0.7rem' }}>Stock: {p.current_stock}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Lado Derecho: Venta */}
            <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>🛒 Carrito</h2>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {cart.map(item => (
                        <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.9rem' }}>
                                <div>{item.product.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${item.product.unit_price} x {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 700 }}>${(item.product.unit_price * item.quantity).toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                <div style={{ padding: '1rem 0', borderTop: '2px solid var(--border-color)' }}>
                    {/* Cliente */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label" style={{ fontSize: '0.8rem' }}>Cliente (Opcional)</label>
                        <select className="input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value ? Number(e.target.value) : "")}>
                            <option value="">Cliente Genérico</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Saldo: ${c.balance})</option>
                            ))}
                        </select>
                    </div>

                    {/* Método de Pago */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label" style={{ fontSize: '0.8rem' }}>Método de Pago</label>
                        <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="Efectivo">💵 Efectivo</option>
                            <option value="Tarjeta">💳 Tarjeta</option>
                            <option value="Transferencia">📱 Transferencia</option>
                            <option value="Crédito">📋 Crédito (Fiado)</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 900, marginBottom: '1rem' }}>
                        <span>TOTAL</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleCheckout} disabled={processing || cart.length === 0}>
                        {processing ? "Cargando..." : "FINALIZAR VENTA"}
                    </button>

                    {lastOrderId && (
                        <button
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '0.5rem', backgroundColor: '#10b981', color: 'white' }}
                            onClick={() => downloadReceipt(lastOrderId)}
                        >
                            🖨️ Descargar Recibo #{lastOrderId}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
