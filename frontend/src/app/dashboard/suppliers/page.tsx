"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";

interface Supplier {
    id: number;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    address: string;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const initialForm = { name: "", contact_name: "", email: "", phone: "", address: "" };
    const [formData, setFormData] = useState(initialForm);

    const fetchSuppliers = async (query = "") => {
        try {
            setLoading(true);
            const endpoint = query ? `/suppliers/search?q=${query}` : "/suppliers/";
            const { data } = await api.get(endpoint);
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSuppliers(searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar proveedor?")) return;
        try {
            await api.delete(`/suppliers/${id}`);
            fetchSuppliers();
        } catch (error) {
            alert("No se pudo eliminar el proveedor.");
        }
    };

    const handleOpenModal = (sup: Supplier | null = null) => {
        if (sup) {
            setEditingSupplier(sup);
            setFormData({
                name: sup.name,
                contact_name: sup.contact_name || "",
                email: sup.email || "",
                phone: sup.phone || "",
                address: sup.address || ""
            });
        } else {
            setEditingSupplier(null);
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData);
            } else {
                await api.post("/suppliers/", formData);
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            alert("Error al guardar proveedor.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Proveedores</h1>
                <div className={styles.controls}>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Contacto</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>Cargando...</td></tr> :
                            suppliers.map((s) => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                                    <td>{s.contact_name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.phone}</td>
                                    <td className={styles.actions}>
                                        <button className="btn" onClick={() => handleOpenModal(s)}>✏️</button>
                                        <button className="btn" onClick={() => handleDelete(s.id)} style={{ color: 'var(--error-color)' }}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                            <button onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="text-sm font-medium">Nombre Empresa*</label>
                                <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Contacto</label>
                                <input className="input" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Teléfono</label>
                                <input className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="text-sm font-medium">Email</label>
                                <input type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="text-sm font-medium">Dirección</label>
                                <input className="input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
