"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { downloadCSV } from "@/services/exportUtils";

// Interfaces para los reportes
interface InventorySummary {
    total_products: number;
    total_stock: number;
    total_categories: number;
    total_suppliers: number;
    low_stock_count: number;
}

interface StockValue {
    total_value: number;
    product_count: number;
    average_value: number;
}

interface ProductLowStock {
    id: number;
    name: string;
    current_stock: number;
    min_stock_level: number;
    sku: string;
}

interface TopProduct {
    product_id: number;
    product_name: string;
    total_movements: number;
    total_quantity: number;
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [valueReport, setValueReport] = useState<StockValue | null>(null);
    const [lowStock, setLowStock] = useState<ProductLowStock[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                // Llamadas paralelas a todos los endpoints de reportes
                const results = await Promise.all([
                    api.get("/reports/inventory-summary"),
                    api.get("/reports/stock-value"),
                    api.get("/reports/low-stock"),
                    api.get("/reports/top-products?limit=5")
                ]);

                setSummary(results[0].data);
                setValueReport(results[1].data);

                // Asegurar que sea array
                const lowStockData = Array.isArray(results[2].data) ? results[2].data : (results[2].data.items || []);
                setLowStock(lowStockData);

                const topProductsData = Array.isArray(results[3].data) ? results[3].data : (results[3].data.items || []);
                setTopProducts(topProductsData);
            } catch (error) {
                console.error("Error fetching reports", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const Card = ({ title, value, subtext, color }: any) => (
        <div className="card" style={{ borderTop: `4px solid ${color}` }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{title}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{value}</p>
            {subtext && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtext}</p>}
        </div>
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reportes y Análisis</h1>

            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <Card
                    title="Total Productos"
                    value={summary?.total_products || 0}
                    subtext={`${summary?.total_categories || 0} Categorías`}
                    color="var(--primary-color)"
                />
                <Card
                    title="Valor Inventario"
                    value={`$${valueReport?.total_value?.toLocaleString() || 0}`}
                    subtext={`Promedio: $${valueReport?.average_value?.toFixed(2) || 0}`}
                    color="var(--success-color)"
                />
                <Card
                    title="Stock Total"
                    value={summary?.total_stock || 0}
                    subtext="Unidades físicas"
                    color="#3b82f6"
                />
                <Card
                    title="Alerta Stock"
                    value={summary?.low_stock_count || 0}
                    subtext="Productos bajo mínimo"
                    color="var(--error-color)"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1rem' }}>

                {/* TOP PRODUCTOS */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🔥 Productos Más Movidos</h2>
                        <button
                            className="btn"
                            style={{ fontSize: '0.8rem', border: '1px solid var(--border-color)' }}
                            onClick={() => downloadCSV(topProducts, 'top_productos')}
                        >
                            📥 Exportar
                        </button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Movimientos</th>
                                <th>Cant. Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? <tr><td colSpan={3}>Sin movimientos</td></tr> :
                                topProducts.map((p, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                                        <td>{p.total_movements}</td>
                                        <td>{p.total_quantity}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* ALERTA STOCK BAJO */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--error-color)' }}>⚠️ Alerta de Reabastecimiento</h2>
                        <button
                            className="btn"
                            style={{ fontSize: '0.8rem', border: '1px solid var(--error-color)', color: 'var(--error-color)' }}
                            onClick={() => downloadCSV(lowStock, 'stock_bajo')}
                        >
                            📥 Exportar
                        </button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Producto</th>
                                <th>Stock Actual</th>
                                <th>Mínimo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStock.length === 0 ? <tr><td colSpan={4}>Todo en orden ✅</td></tr> :
                                lowStock.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontSize: '0.85rem' }}>{p.sku}</td>
                                        <td>{p.name}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--error-color)' }}>{p.current_stock}</td>
                                        <td>{p.min_stock_level}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
