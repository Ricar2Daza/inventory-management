"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { downloadCSV } from "@/services/exportUtils";

// Interfaces para los reportes
interface InventorySummary {
    total_products: number;
    total_categories: number;
    total_suppliers: number;
    total_stock_value: number;
    low_stock_products: number;
    out_of_stock_products: number;
}

interface StockValue {
    total_value: number;
    total_products: number;
    average_product_value: number;
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
    entries_count: number;
    exits_count: number;
    quantity_in: number;
    quantity_out: number;
    net_quantity: number;
}

interface MovementSummary {
    total_movements: number;
    total_entries: number;
    total_exits: number;
    total_quantity_in: number;
    total_quantity_out: number;
    period_start: string;
    period_end: string;
}

interface SupplierInventory {
    supplier_id: number;
    supplier_name: string;
    total_products: number;
    total_stock: number;
    total_value: number;
}

export default function ReportsPage() {
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [valueReport, setValueReport] = useState<StockValue | null>(null);
    const [lowStock, setLowStock] = useState<ProductLowStock[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [movementsSummary, setMovementsSummary] = useState<MovementSummary | null>(null);
    const [supplierReport, setSupplierReport] = useState<SupplierInventory[]>([]);

    const [totalStockUnits, setTotalStockUnits] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [movementsDays, setMovementsDays] = useState(30);
    const [topProductsDays, setTopProductsDays] = useState(30);

    // Carga inicial de datos estáticos o generales
    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                setLoading(true);
                const results = await Promise.all([
                    api.get("/reports/inventory-summary"),
                    api.get("/reports/stock-value"),
                    api.get("/reports/low-stock"),
                    api.get("/reports/by-category"),
                    api.get("/reports/by-supplier")
                ]);

                setSummary(results[0].data);
                setValueReport(results[1].data);
                setLowStock(results[2].data?.products || []);
                
                const categories = results[3].data?.categories || [];
                const totalUnits = categories.reduce(
                    (acc: number, c: any) => acc + (c.total_stock || 0),
                    0
                );
                setTotalStockUnits(totalUnits);
                
                setSupplierReport(results[4].data?.suppliers || []);

            } catch (error) {
                console.error("Error fetching global reports", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalData();
    }, []);

    // Carga de movimientos con filtro
    useEffect(() => {
        const fetchMovements = async () => {
            try {
                const { data } = await api.get(`/reports/movements?days=${movementsDays}`);
                setMovementsSummary(data);
            } catch (error) {
                console.error("Error fetching movements", error);
            }
        };
        fetchMovements();
    }, [movementsDays]);

    // Carga de top productos con filtro
    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const { data } = await api.get(`/reports/top-products?limit=5&days=${topProductsDays}`);
                setTopProducts(data.products || []);
            } catch (error) {
                console.error("Error fetching top products", error);
            }
        };
        fetchTopProducts();
    }, [topProductsDays]);

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
                    subtext={`Promedio: $${valueReport?.average_product_value?.toFixed(2) || 0}`}
                    color="var(--success-color)"
                />
                <Card
                    title="Stock Total"
                    value={totalStockUnits || 0}
                    subtext="Unidades físicas"
                    color="#3b82f6"
                />
                <Card
                    title="Alerta Stock"
                    value={summary?.low_stock_products || 0}
                    subtext="Productos bajo mínimo"
                    color="var(--error-color)"
                />
            </div>

            {/* NUEVA SECCIÓN: Resumen de Movimientos */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>📊 Flujo de Inventario</h2>
                    <select 
                        className="input"
                        style={{ width: 'auto', padding: '0.4rem' }}
                        value={movementsDays}
                        onChange={(e) => setMovementsDays(Number(e.target.value))}
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={15}>Últimos 15 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={60}>Últimos 60 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                </div>
                {movementsSummary ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#166534' }}>Total Entradas</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803d' }}>{movementsSummary.total_entries}</p>
                            <p style={{ fontSize: '0.75rem', color: '#166534' }}>+{movementsSummary.total_quantity_in} unds.</p>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>Total Salidas</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c' }}>{movementsSummary.total_exits}</p>
                            <p style={{ fontSize: '0.75rem', color: '#991b1b' }}>-{movementsSummary.total_quantity_out} unds.</p>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>Total Movimientos</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>{movementsSummary.total_movements}</p>
                        </div>
                    </div>
                ) : <p>Cargando datos de flujo...</p>}
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1rem' }}>

                {/* TOP PRODUCTOS */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🔥 Productos Más Movidos</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select 
                                className="input"
                                style={{ width: 'auto', padding: '0.3rem', fontSize: '0.8rem' }}
                                value={topProductsDays}
                                onChange={(e) => setTopProductsDays(Number(e.target.value))}
                            >
                                <option value={7}>7 días</option>
                                <option value={30}>30 días</option>
                                <option value={90}>90 días</option>
                            </select>
                            <button
                                className="btn"
                                style={{ fontSize: '0.8rem', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}
                                onClick={() => downloadCSV(topProducts, 'top_productos')}
                            >
                                📥
                            </button>
                        </div>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Movs.</th>
                                    <th>Entradas</th>
                                    <th>Salidas</th>
                                    <th>Neto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length === 0 ? <tr><td colSpan={5}>Sin movimientos</td></tr> :
                                    topProducts.map((p, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                                            <td>{p.total_movements}</td>
                                            <td style={{ color: 'var(--success-color)' }}>{p.quantity_in}</td>
                                            <td style={{ color: 'var(--error-color)' }}>{p.quantity_out}</td>
                                            <td style={{ fontWeight: 600 }}>{p.net_quantity}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
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
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    <th>Producto</th>
                                    <th>Stock</th>
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

            {/* NUEVA SECCIÓN: Inventario por Proveedor */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🏭 Inventario por Proveedor</h2>
                    <button
                        className="btn"
                        style={{ fontSize: '0.8rem', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}
                        onClick={() => downloadCSV(supplierReport, 'inventario_proveedores')}
                    >
                        📥 Exportar
                    </button>
                </div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>Items Diferentes</th>
                                <th>Total Stock (Unds)</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierReport.length === 0 ? <tr><td colSpan={4}>Sin información.</td></tr> :
                                supplierReport.map((s) => (
                                    <tr key={s.supplier_id}>
                                        <td style={{ fontWeight: 500 }}>{s.supplier_name || 'Sin Proveedor Asignado'}</td>
                                        <td>{s.total_products}</td>
                                        <td>{s.total_stock}</td>
                                        <td>${s.total_value.toLocaleString()}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
