"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    identification: string;
    balance: number;
    address: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        identification: "",
        address: ""
    });

    const loadClients = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/clients/");
            setClients(data);
        } catch (error) {
            console.error("Error loading clients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, formData);
            } else {
                await api.post("/clients/", formData);
            }
            setShowModal(false);
            setEditingClient(null);
            setFormData({ name: "", email: "", phone: "", identification: "", address: "" });
            loadClients();
        } catch (error: any) {
            alert("Error: " + (error.response?.data?.detail || "No se pudo guardar"));
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || "",
            phone: client.phone || "",
            identification: client.identification || "",
            address: client.address || ""
        });
        setShowModal(true);
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Gestión de Clientes 👤</h1>
                <button 
                    className="btn btn-primary" 
                    onClick={() => {
                        setEditingClient(null);
                        setFormData({ name: "", email: "", phone: "", identification: "", address: "" });
                        setShowModal(true);
                    }}
                >
                    + Nuevo Cliente
                </button>
            </div>

            {loading ? (
                <p>Cargando clientes...</p>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <thead style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID / Identificación</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contacto</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saldo/Deuda</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>#{client.id}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.identification || 'Sin ID'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{client.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{client.phone || '-'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.email || ''}</div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <span style={{ 
                                            fontWeight: 700, 
                                            color: client.balance < 0 ? 'var(--error-color)' : 'var(--success-color)' 
                                        }}>
                                            ${client.balance.toFixed(2)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleEdit(client)}>Editar</button>
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
                        <h2>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label className="label">Nombre completo</label>
                                <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="label">Identificación (DNI/RUC)</label>
                                <input className="input" value={formData.identification} onChange={e => setFormData({...formData, identification: e.target.value})} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label className="label">Teléfono</label>
                                    <input className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Dirección</label>
                                <input className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
