"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { downloadCSV } from "@/services/exportUtils";

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

interface FinancialBalance {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    period_start: string;
    period_end: string;
}

interface DebtItem {
    id: number;
    name: string;
    balance: number;
}

interface DebtReport {
    items: DebtItem[];
    total_debt: number;
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

    const [movementsDays, setMovementsDays] = useState(30);
    const [topProductsDays, setTopProductsDays] = useState(30);
    const [financialDays, setFinancialDays] = useState(30);

    const [financialBalance, setFinancialBalance] = useState<FinancialBalance | null>(null);
    const [clientDebtReport, setClientDebtReport] = useState<DebtReport | null>(null);
    const [supplierDebtReport, setSupplierDebtReport] = useState<DebtReport | null>(null);

    const [aiQuestion, setAiQuestion] = useState("");
    const [aiAnswer, setAiAnswer] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                setLoading(true);
                const results = await Promise.all([
                    api.get("/reports/inventory-summary"),
                    api.get("/reports/stock-value"),
                    api.get("/reports/low-stock"),
                    api.get("/reports/by-category"),
                    api.get("/reports/by-supplier"),
                    api.get("/reports/debts/clients"),
                    api.get("/reports/debts/suppliers")
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
                setClientDebtReport(results[5].data);
                setSupplierDebtReport(results[6].data);

            } catch (error) {
                console.error("Error fetching global reports", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalData();
    }, []);

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

    useEffect(() => {
        const fetchFinancialBalance = async () => {
            try {
                const { data } = await api.get(`/reports/financial-balance?days=${financialDays}`);
                setFinancialBalance(data);
            } catch (error) {
                console.error("Error fetching financial balance", error);
            }
        };
        fetchFinancialBalance();
    }, [financialDays]);

    const handleAskAI = async () => {
        try {
            setAiLoading(true);
            setAiError("");
            const fallbackQuestion =
                "Genera un resumen ejecutivo de la situación del inventario y las finanzas y propone entre 3 y 7 acciones concretas para mejorar el negocio.";
            const { data } = await api.post("/ai/report-summary", {
                question: aiQuestion || fallbackQuestion,
            });
            setAiAnswer(data.answer);
        } catch (error: any) {
            console.error("Error al consultar la IA", error);
            const responseData = error?.response?.data;
            const detail = responseData?.detail;
            if (typeof detail === "string") {
                setAiError(detail);
            } else if (detail && typeof detail === "object") {
                try {
                    setAiError(JSON.stringify(detail, null, 2));
                } catch {
                    setAiError("No se pudo obtener una respuesta de la IA.");
                }
            } else if (responseData) {
                try {
                    setAiError(JSON.stringify(responseData, null, 2));
                } catch {
                    setAiError("No se pudo obtener una respuesta de la IA.");
                }
            } else {
                setAiError("No se pudo obtener una respuesta de la IA.");
            }
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Reportes y Análisis</h1>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>🤖 Explicación con IA</h2>
                        <button
                            className="btn"
                            style={{ fontSize: '0.85rem' }}
                            onClick={handleAskAI}
                            disabled={aiLoading}
                        >
                            {aiLoading ? "Analizando..." : "Analizar reportes con IA"}
                        </button>
                    </div>
                    <textarea
                        className="input"
                        style={{ minHeight: '70px', fontSize: '0.9rem' }}
                        placeholder="Escribe una pregunta opcional para la IA, por ejemplo: ¿Qué decisiones tomarías esta semana con estos datos?"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                    />
                    {aiError && (
                        <p style={{ color: 'var(--error-color)', fontSize: '0.85rem' }}>
                            {aiError}
                        </p>
                    )}
                    {aiAnswer && (
                        <div
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-color)',
                                fontSize: '0.9rem',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {aiAnswer}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Valor Inventario</p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                        ${valueReport?.total_value?.toLocaleString() ?? 0}
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Total Productos</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.total_products ?? 0}</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Stock Bajo</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: (summary?.low_stock_products || 0) > 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
                        {summary?.low_stock_products ?? 0}
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Agotados</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: (summary?.out_of_stock_products || 0) > 0 ? '#b91c1c' : 'var(--text-secondary)' }}>
                        {summary?.out_of_stock_products ?? 0}
                    </p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Total Unidades</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {totalStockUnits.toLocaleString()}
                    </p>
                </div>
            </div>

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

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>💰 Resumen Financiero</h2>
                    <select
                        className="input"
                        style={{ width: 'auto', padding: '0.4rem' }}
                        value={financialDays}
                        onChange={(e) => setFinancialDays(Number(e.target.value))}
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={60}>Últimos 60 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                </div>
                {financialBalance ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', textAlign: 'center' }}>
                        <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#1d4ed8' }}>Ingresos</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>
                                ${financialBalance.total_revenue.toLocaleString()}
                            </p>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>Gastos</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c' }}>
                                ${financialBalance.total_expenses.toLocaleString()}
                            </p>
                        </div>
                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: (financialBalance.net_profit ?? 0) >= 0 ? '#166534' : '#b91c1c' }}>Resultado</p>
                            <p
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    color: (financialBalance.net_profit ?? 0) >= 0 ? '#16a34a' : '#b91c1c'
                                }}
                            >
                                ${financialBalance.net_profit.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ) : <p>Cargando datos financieros...</p>}
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '1rem' }}>

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

            <div className="card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>📒 Deudas y Créditos</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            className="btn"
                            style={{ fontSize: '0.8rem', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}
                            onClick={() => clientDebtReport && downloadCSV(clientDebtReport.items, "deudas_clientes")}
                        >
                            📥 Clientes
                        </button>
                        <button
                            className="btn"
                            style={{ fontSize: '0.8rem', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}
                            onClick={() => supplierDebtReport && downloadCSV(supplierDebtReport.items, "deudas_proveedores")}
                        >
                            📥 Proveedores
                        </button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Clientes con saldo pendiente</h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Cliente</th>
                                        <th>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clientDebtReport && clientDebtReport.items.length > 0 ? (
                                        clientDebtReport.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td style={{ color: 'var(--error-color)', fontWeight: 600 }}>
                                                    ${Math.abs(item.balance).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2}>Sin deudas registradas.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Proveedores por pagar</h3>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Proveedor</th>
                                        <th>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplierDebtReport && supplierDebtReport.items.length > 0 ? (
                                        supplierDebtReport.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td style={{ color: 'var(--error-color)', fontWeight: 600 }}>
                                                    ${Math.abs(item.balance).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2}>Sin pendientes con proveedores.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
