"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "General",
        date: new Date().toISOString().split('T')[0]
    });

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/expenses/");
            setExpenses(data);
        } catch (error) {
            console.error("Error loading expenses", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/expenses/", {
                ...formData,
                amount: parseFloat(formData.amount)
            });
            setShowModal(false);
            setFormData({ description: "", amount: "", category: "General", date: new Date().toISOString().split('T')[0] });
            loadExpenses();
        } catch (error: any) {
            alert("Error: " + (error.response?.data?.detail || "No se pudo registrar"));
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gastos del Negocio 💸</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Registrar Gasto</button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--error-color)' }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Gastos (Histórico)</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--error-color)' }}>${totalExpenses.toLocaleString()}</p>
            </div>

            {loading ? (
                <p>Cargando gastos...</p>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>Fecha</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>Descripción</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem' }}>Categoría</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{expense.description}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className="badge" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--error-color)' }}>
                                        -${expense.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2>Registrar Gasto</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label className="label">Descripción</label>
                                <input className="input" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Monto ($)</label>
                                <input type="number" step="0.01" className="input" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="label">Categoría</label>
                                <select className="input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="General">General</option>
                                    <option value="Servicios">Servicios (Luz, Agua, etc)</option>
                                    <option value="Alquiler">Alquiler</option>
                                    <option value="Sueldos">Sueldos</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Compras">Compras de Insumos</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Fecha</label>
                                <input type="date" className="input" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
