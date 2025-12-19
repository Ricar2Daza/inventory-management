"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link";

// Sub-component for individual metric cards
const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <div className="card" style={{ borderLeft: `4px solid ${color}` }}>
        <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
    </div>
);

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        lowStock: 0,
        totalValue: 0,
        outOfStock: 0
    });
    const [salesStats, setSalesStats] = useState({
        todayRevenue: 0,
        totalRevenue: 0,
        averageOrderValue: 0
    });
    const [recentMovements, setRecentMovements] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [categoriesData, setCategoriesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Fetch all dashboard data concurrently
                const [summaryRes, valueRes, movementsRes, salesRes, topRes, categoryRes] = await Promise.all([
                    api.get('/reports/inventory-summary'),
                    api.get('/reports/stock-value'),
                    api.get('/stock-movements/?limit=5'),
                    api.get('/reports/sales-summary'),
                    api.get('/reports/top-products?limit=5'),
                    api.get('/reports/by-category')
                ]);

                setStats({
                    totalProducts: summaryRes.data.total_products,
                    lowStock: summaryRes.data.low_stock_products,
                    totalValue: valueRes.data.total_value,
                    outOfStock: summaryRes.data.out_of_stock_products || 0
                });

                setSalesStats({
                    todayRevenue: salesRes.data.today_revenue,
                    totalRevenue: salesRes.data.total_revenue,
                    averageOrderValue: salesRes.data.average_order_value
                });

                const moves = Array.isArray(movementsRes.data) ? movementsRes.data : (movementsRes.data.items || []);
                setRecentMovements(moves);

                const tops = Array.isArray(topRes.data.products) ? topRes.data.products : [];
                setTopProducts(tops);

                const cats = Array.isArray(categoryRes.data.categories) ? categoryRes.data.categories : [];
                setCategoriesData(cats);

            } catch (error) {
                if (process.env.NODE_ENV !== "production") console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Resumen General</h1>

            {/* Inventory & Sales Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }} className="dashboard-grid">
                {/* Inventory Stats */}
                <StatCard
                    title="Total Productos"
                    value={loading ? "..." : stats.totalProducts}
                    color="var(--primary-color)"
                />
                <StatCard
                    title="Stock Bajo"
                    value={loading ? "..." : stats.lowStock}
                    color="var(--warning-color)"
                />

                {/* Sales Stats (Phase 1) */}
                <StatCard
                    title="Ventas Hoy"
                    value={loading ? "..." : `$${salesStats.todayRevenue.toLocaleString()}`}
                    color="var(--secondary-color)"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={loading ? "..." : `$${salesStats.averageOrderValue.toLocaleString()}`}
                    color="#8b5cf6"
                />

                <StatCard
                    title="Valor del Inventario"
                    value={loading ? "..." : `$${stats.totalValue.toLocaleString()}`}
                    color="#6366f1"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }} className="dashboard-grid">
                {/* Activity Feed */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Actividad Reciente</h2>
                        <Link href="/dashboard/inventory" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                            Ver todo →
                        </Link>
                    </div>

                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando actividad...</p>
                    ) : recentMovements.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay movimientos recientes.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recentMovements.map((m: any) => (
                                <div key={m.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingBottom: '0.75rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    fontSize: '0.9rem'
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 500 }}>
                                            {m.product?.name || `Producto #${m.product_id}`}
                                        </span>
                                        <span style={{
                                            color: 'var(--text-secondary)',
                                            marginLeft: '0.5rem',
                                            fontSize: '0.8rem'
                                        }}>
                                            ({new Date(m.created_at).toLocaleDateString()})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            color: m.movement_type === 'entrada' ? 'var(--success-color)' : 'var(--error-color)',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            textTransform: 'uppercase'
                                        }}>
                                            {m.movement_type}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>{m.quantity} un.</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Selling Products (Phase 2) */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Productos Más Vendidos 🏆</h2>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando ranking...</p>
                    ) : topProducts.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Sin ventas registradas.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {topProducts.map((p, index) => (
                                <div key={p.product_id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{
                                            fontWeight: 700,
                                            color: index === 0 ? '#f59e0b' : 'var(--text-secondary)',
                                            width: '20px'
                                        }}>
                                            #{index + 1}
                                        </span>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.product_name}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>SKU: {p.sku}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            backgroundColor: 'var(--primary-light)',
                                            color: 'var(--primary-color)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700
                                        }}>
                                            {p.quantity_out} un.
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Inventory Health (Phase 3) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }} className="dashboard-grid">
                {/* Stock Health */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Salud del Inventario 🏥</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Productos con Alerta</span>
                                <span style={{ fontWeight: 600 }}>{stats.lowStock} de {stats.totalProducts}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${stats.totalProducts > 0 ? (stats.lowStock / stats.totalProducts) * 100 : 0}%`,
                                    backgroundColor: 'var(--warning-color)'
                                }} />
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                <span>Productos Agotados</span>
                                <span style={{ fontWeight: 600 }}>{stats.outOfStock} de {stats.totalProducts}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${stats.totalProducts > 0 ? (stats.outOfStock / stats.totalProducts) * 100 : 0}%`,
                                    backgroundColor: 'var(--error-color)'
                                }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Distribution */}
                <div className="card">
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Distribución por Categoría 🏢</h2>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)' }}>Cargando categorías...</p>
                    ) : categoriesData.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No hay categorías registradas.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {categoriesData.map((c) => (
                                <div key={c.category_id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.category_name}</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 600 }}>${c.total_value.toLocaleString()}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{c.total_products} productos</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
