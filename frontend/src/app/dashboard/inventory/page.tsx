"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";

interface Product {
    id: number;
    name: string;
    sku: string;
    current_stock: number;
}

interface StockMovement {
    id: number;
    product_id: number;
    movement_type: "entrada" | "salida";
    quantity: number;
    reason: string;
    created_at: string;
    product: Product; // Asumiendo que el backend hace join o populate
}

type ApiError = { response?: { data?: { detail?: string } } };

export default function InventoryPage() {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        product_id: "",
        movement_type: "entrada",
        quantity: 1,
        reason: ""
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [movRes, prodRes] = await Promise.all([
                api.get("/stock-movements/"), // Endpoint para historial
                api.get("/products/?limit=100") // Para el selector
            ]);
            setMovements(movRes.data);
            const items = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.items || []);
            setProducts(items);
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error fetching inventory data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_id) return alert("Seleccione un producto");

        try {
            await api.post("/stock-movements/", {
                ...formData,
                product_id: Number(formData.product_id),
                quantity: Number(formData.quantity)
            });

            setFormData(prev => ({ ...prev, quantity: 1, reason: "" }));
            fetchData();
            alert("Movimiento registrado con éxito");
        } catch (error: unknown) {
            if (process.env.NODE_ENV !== "production") console.error("Error creating movement", error);
            const err = error as ApiError;
            alert(err.response?.data?.detail || "Error al registrar movimiento");
        }
    };
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gestión de Inventario</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* FORMULARIO DE MOVIMIENTO */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Registrar Movimiento</h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div>
                            <label className="text-sm font-medium">Tipo de Movimiento</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="type"
                                        checked={formData.movement_type === "entrada"}
                                        onChange={() => setFormData({ ...formData, movement_type: "entrada" })}
                                    />
                                    <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>Entrada (+Stock)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="type"
                                        checked={formData.movement_type === "salida"}
                                        onChange={() => setFormData({ ...formData, movement_type: "salida" })}
                                    />
                                    <span style={{ color: 'var(--error-color)', fontWeight: 600 }}>Salida (-Stock)</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Producto</label>
                            <select
                                className="input"
                                value={formData.product_id}
                                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.sku} - {p.name} (Stock: {p.current_stock})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Cantidad</label>
                            <input
                                type="number"
                                min="1"
                                className="input"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Razón / Nota</label>
                            <input
                                className="input"
                                placeholder="Ej. Compra de proveedor, Venta #123..."
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            Registrar Movimiento
                        </button>
                    </form>
                </div>

                {/* HISTORIAL */}
                <div className={styles.tableContainer}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Historial de Movimientos</h2>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Producto</th>
                                <th>Tipo</th>
                                <th>Cant.</th>
                                <th>Razón</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>Cargando...</td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>No hay movimientos registrados.</td></tr>
                            ) : (
                                movements.map((m) => (
                                    <tr key={m.id}>
                                        <td style={{ fontSize: '0.85rem' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                                        <td>{m.product ? m.product.name : `ID: ${m.product_id}`}</td>
                                        <td>
                                            <span className={m.movement_type === 'entrada' ? styles.badgeSuccess : styles.badgeDanger} style={{ borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem' }}>
                                                {m.movement_type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{m.quantity}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{m.reason}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
