"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

interface Product {
    id: number;
    name: string;
    description: string;
    unit_price: number;
    current_stock: number;
    sku: string;
    category?: { name: string };
}

export default function PublicCatalog() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Not using the authenticated axios instance if possible, 
                // but if we use the same baseURL, it might work if the backend allows it.
                const { data } = await api.get("/products/?limit=100");
                setProducts(Array.isArray(data) ? data : data.items);
            } catch (error) {
                console.error("Error fetching catalog", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleWhatsAppOrder = (product: Product) => {
        const message = `Hola! 👋 Me interesa este producto: ${product.name} (Ref: ${product.sku}). ¿Está disponible?`;
        window.open(`https://wa.me/573000000000?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#2563eb' }}>Catálogo Online 🛍️</h1>
                <p style={{ color: '#64748b' }}>Explora nuestros productos y haz tu pedido por WhatsApp</p>
                <div style={{ marginTop: '2rem', maxWidth: '500px', margin: '2rem auto' }}>
                    <input
                        className="input"
                        placeholder="🔍 Buscar productos..."
                        style={{ padding: '1rem', borderRadius: '50px' }}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center' }}>Cargando catálogo...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {filtered.map(p => (
                        <div key={p.id} className="card" style={{
                            display: 'flex', flexDirection: 'column',
                            transition: 'transform 0.2s', cursor: 'default'
                        }}>
                            <div style={{
                                height: '200px', backgroundColor: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '8px', marginBottom: '1rem'
                            }}>
                                <span style={{ fontSize: '3rem' }}>📦</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>{p.category?.name || 'General'}</span>
                                <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>{p.name}</h3>
                                <p style={{ fontSize: '0.9rem', color: '#64748b', height: '3rem', overflow: 'hidden' }}>{p.description}</p>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '1rem' }}>${p.unit_price.toLocaleString()}</div>
                                <div style={{ fontSize: '0.8rem', color: p.current_stock > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                    {p.current_stock > 0 ? 'En Stock' : 'Agotado'}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1.5rem', backgroundColor: '#25d366', border: 'none' }}
                                onClick={() => handleWhatsAppOrder(p)}
                            >
                                💬 Consultar por WhatsApp
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style jsx global>{`
                .card:hover { transform: translateY(-5px); }
            `}</style>
        </div>
    );
}
