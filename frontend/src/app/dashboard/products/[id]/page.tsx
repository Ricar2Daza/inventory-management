"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useParams, useRouter } from "next/navigation";
import styles from "../page.module.css"; // Reutilizar estilos de tabla y contenedor

interface ProductDetail {
    id: number;
    name: string;
    description: string;
    sku: string;
    current_stock: number;
    min_stock_level: number;
    unit_price: number;
    category?: { name: string };
    supplier?: { name: string };
}

interface StockMovement {
    id: number;
    movement_type: "entrada" | "salida";
    quantity: number;
    reason: string;
    created_at: string;
    user?: { username: string };
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id;

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [prodRes, movRes] = await Promise.all([
                    api.get(`/products/${id}`),
                    api.get(`/stock-movements/product/${id}`)
                ]);

                setProduct(prodRes.data);
                // El endpoint de movimientos devuelve una lista directa
                setMovements(movRes.data);

            } catch (err: any) {
                console.error(err);
                setError("Error cargando información del producto.");
                if (err.response?.status === 404) setError("Producto no encontrado.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className={styles.container} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
    if (error) return (
        <div className={styles.container}>
            <div style={{ color: 'var(--error-color)', padding: '1rem', border: '1px solid var(--error-color)', borderRadius: '8px' }}>
                {error}
                <br />
                <button className="btn btn-primary" onClick={() => router.back()} style={{ marginTop: '1rem' }}>Volver</button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <button onClick={() => router.back()} className="btn" style={{ marginBottom: '0.5rem', paddingLeft: 0, color: 'var(--text-secondary)' }}>
                        ← Volver
                    </button>
                    <h1 className={styles.title}>{product?.name}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>SKU: {product?.sku}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: (product?.current_stock || 0) <= (product?.min_stock_level || 0) ? 'var(--error-color)' : 'var(--success-color)' }}>
                        {product?.current_stock}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Unidades en Stock</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>

                {/* INFO CARD */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Detalles</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Descripción</label>
                            <p>{product?.description || "Sin descripción"}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Precio</label>
                            <p>${product?.unit_price}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categoría</label>
                            <p>{product?.category?.name || "-"}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Proveedor</label>
                            <p>{product?.supplier?.name || "-"}</p>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Stock Mínimo</label>
                            <p>{product?.min_stock_level}</p>
                        </div>
                    </div>
                </div>

                {/* MOVEMENTS HISTORY */}
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Historial de Movimientos</h2>
                    <div className={styles.tableContainer} style={{ boxShadow: 'none' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Cantidad</th>
                                    <th>Razón</th>
                                    {/* <th>Usuario</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {movements.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>Sin movimientos registrados.</td></tr> :
                                    movements.map((m) => (
                                        <tr key={m.id}>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(m.created_at).toLocaleString()}</td>
                                            <td>
                                                <span className={m.movement_type === 'entrada' ? styles.badgeSuccess : styles.badgeDanger} style={{ borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem' }}>
                                                    {m.movement_type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{m.reason}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
