"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import Link from "next/link"; // Importar Link para navegación

// Componentes de Tarjetas simples para el dashboard inicial
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
        totalValue: 0
    });
    const [recentMovements, setRecentMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                // Fetch real data
                const [summaryRes, valueRes, movementsRes] = await Promise.all([
                    api.get('/reports/inventory-summary'),
                    api.get('/reports/stock-value'),
                    api.get('/stock-movements/?limit=5') // Obtener últimos 5 movimientos
                ]);

                setStats({
                    totalProducts: summaryRes.data.total_products,
                    lowStock: summaryRes.data.low_stock_products,
                    totalValue: valueRes.data.total_value
                });

                // Handle movements array safely
                const moves = Array.isArray(movementsRes.data) ? movementsRes.data : (movementsRes.data.items || []);
                setRecentMovements(moves);

            } catch (error) {
                if (process.env.NODE_ENV !== "production") console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Resumen General</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
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
                <StatCard
                    title="Valor del Inventario"
                    value={loading ? "..." : `$${stats.totalValue.toLocaleString()}`}
                    color="var(--success-color)"
                />
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Actividad Reciente</h2>
                    <Link href="/dashboard/inventory" prefetch={false} style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
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
        </div>
    );
}
