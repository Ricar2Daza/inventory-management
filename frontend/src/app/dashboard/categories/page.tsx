"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css"; // Reutilizamos estilos

interface Category {
    id: number;
    name: string;
    description: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/categories/");
            setCategories(data);
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar categoría? Esto podría afectar a los productos asociados.")) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error deleting category", error);
            alert("No se pudo eliminar. Verifique que no tenga productos asociados.");
        }
    };

    const handleOpenModal = (cat: Category | null = null) => {
        if (cat) {
            setEditingCategory(cat);
            setFormData({ name: cat.name, description: cat.description || "" });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", description: "" });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory.id}`, formData);
            } else {
                await api.post("/categories/", formData);
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error saving category", error);
            alert("Error al guardar categoría.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Categorías</h1>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Nueva Categoría
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>Cargando...</td></tr> :
                            categories.map((c) => (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{c.description}</td>
                                    <td className={styles.actions}>
                                        <button className="btn" onClick={() => handleOpenModal(c)}>✏️</button>
                                        <button className="btn" onClick={() => handleDelete(c.id)} style={{ color: 'var(--error-color)' }}>🗑️</button>
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
                            <h2>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium">Nombre</label>
                                <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Descripción</label>
                                <textarea
                                    className="input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Guardar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
