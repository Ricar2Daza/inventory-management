"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import styles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import ImportProductsModal from "@/components/products/ImportProductsModal";

// Interface simplificada según tu backend
interface Product {
    id: number;
    name: string;
    sku: string;
    current_stock: number;
    min_stock_level: number;
    unit_price: number;
    category_id?: number;
    supplier_id?: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { user } = useAuth();

    // Filters
    const [filterCategory, setFilterCategory] = useState<number | "">("");
    const [filterSupplier, setFilterSupplier] = useState<number | "">("");

    // Modal state for Edit/Create
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Modal state for Import
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Catálogos para el formulario
    const [categories, setCategories] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Form state (using string for numbers to handle empty inputs gracefully)
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        current_stock: "",
        min_stock_level: "5",
        unit_price: "",
        category_id: 1,
        supplier_id: 1
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const url = searchTerm
                ? `/products/search?q=${searchTerm}`
                : `/products/?limit=100`;

            const { data } = await api.get(url);
            const items = Array.isArray(data) ? data : (data.items || []);
            setProducts(items);

            // Cargar catálogos si no están cargados
            if (categories.length === 0) {
                try {
                    const [catsRes, suppsRes] = await Promise.all([
                        api.get("/categories/"),
                        api.get("/suppliers/")
                    ]);
                    setCategories(catsRes.data);
                    setSuppliers(suppsRes.data);
                } catch (e) {
                    if (process.env.NODE_ENV !== "production") console.error("Error cargando catálogos", e);
                }
            }

        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts(); // Recargar
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error deleting product", error);
            alert("No se pudo eliminar el producto");
        }
    };

    const handleDownloadLabel = async (productId: number) => {
        try {
            const response = await api.get(`/products/${productId}/label`, {
                responseType: 'blob', // Important for PDF
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `label_product_${productId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            if (process.env.NODE_ENV !== "production") console.error("Error downloading label", error);
            alert("Error al descargar etiqueta.");
        }
    };

    const handleOpenModal = (product: Product | null = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                sku: product.sku,
                current_stock: product.current_stock.toString(),
                min_stock_level: product.min_stock_level.toString(),
                unit_price: product.unit_price.toString(),
                category_id: product.category_id || (categories[0]?.id || 1),
                supplier_id: product.supplier_id || (suppliers[0]?.id || 1)
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                sku: "",
                current_stock: "0",
                min_stock_level: "5",
                unit_price: "",
                category_id: categories[0]?.id || 1,
                supplier_id: suppliers[0]?.id || 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDACIONES PREVIAS
        if (categories.length === 0) {
            alert("⚠️ Error: No existen Categorías creadas.\n\nPor favor ve a la sección 'Categorías' y crea una antes de continuar.");
            return;
        }
        if (suppliers.length === 0) {
            alert("⚠️ Error: No existen Proveedores creados.\n\nPor favor ve a la sección 'Proveedores' y crea uno antes de continuar.");
            return;
        }

        try {
            // Asegurarnos de enviar IDs válidos (si el usuario no tocó el select, tomar el primero de la lista real)
            const payload = {
                ...formData,
                current_stock: Number(formData.current_stock),
                min_stock_level: Number(formData.min_stock_level),
                unit_price: Number(formData.unit_price),
                category_id: formData.category_id || categories[0].id,
                supplier_id: formData.supplier_id || suppliers[0].id
            };

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, payload);
            } else {
                await api.post("/products/", payload);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error: any) {
            if (process.env.NODE_ENV !== "production") console.error("Error saving product", error);
            const message = error.response?.data?.detail || "Error al guardar el producto.";
            alert(`Error: ${message}`);
        }
    };

    // Helper para el badge de stock
    const getStockStatus = (current: number, min: number) => {
        if (current === 0) return { label: "Agotado", class: styles.badgeDanger };
        if (current <= min) return { label: "Bajo Stock", class: styles.badgeWarning };
        return { label: "En Stock", class: styles.badgeSuccess };
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Productos</h1>
                <div className={styles.controls} style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className={styles.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    
                    <select 
                        className="input" 
                        style={{ width: 'auto', padding: '0.5rem' }}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : "")}
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select 
                        className="input" 
                        style={{ width: 'auto', padding: '0.5rem' }}
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value ? Number(e.target.value) : "")}
                    >
                        <option value="">Todos los Proveedores</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <button
                        className="btn btn-secondary"
                        style={{ marginRight: '0.5rem' }}
                        onClick={() => setIsImportModalOpen(true)}
                    >
                        📥 Importar
                    </button>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        + Nuevo
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay productos.</td></tr>
                        ) : (
                            products.map((p) => {
                                const status = getStockStatus(p.current_stock, p.min_stock_level);
                                return (
                                    <tr key={p.id}>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.sku}</td>
                                        <td>{p.name}</td>
                                        <td>${p.unit_price}</td>
                                        <td>{p.current_stock}</td>
                                        <td><span className={`${styles.badge} ${status.class}`}>{status.label}</span></td>
                                        <td className={styles.actions}>
                                            <button
                                                className="btn"
                                                onClick={() => handleDownloadLabel(p.id)}
                                                style={{ color: 'var(--text-primary)', marginRight: '0.5rem', fontSize: '1.2rem' }}
                                                title="Imprimir Etiqueta"
                                            >
                                                🖨️
                                            </button>
                                            <a href={`/dashboard/products/${p.id}`} className="btn" style={{ textDecoration: 'none', color: 'var(--text-primary)', marginRight: '0.5rem', fontSize: '1.2rem' }} title="Ver Historial">📄</a>
                                            <button className="btn" onClick={() => handleOpenModal(p)} style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }} title="Editar">✏️</button>
                                            <button className="btn" onClick={() => handleDelete(p.id)} style={{ color: 'var(--error-color)', fontSize: '1.2rem' }} title="Eliminar">🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <ImportProductsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    fetchProducts();
                }}
            />

            {/* MODAL (Existing Product Form Modal) */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="text-sm font-medium">Nombre</label>
                                <input
                                    className="input"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="text-sm font-medium">SKU</label>
                                    <input
                                        className="input"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Precio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        value={formData.unit_price}
                                        onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="text-sm font-medium">Cantidad Actual</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.current_stock}
                                        onChange={e => setFormData({ ...formData, current_stock: e.target.value })}
                                        disabled={!!editingProduct}
                                        placeholder="Ej: 10"
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                        ¿Cuántas unidades tienes hoy?
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Alerta de Stock Bajo</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.min_stock_level}
                                        onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })}
                                        placeholder="Ej: 5"
                                    />
                                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                                        Avisar cuando queden menos de...
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="text-sm font-medium">Categoría</label>
                                    <select
                                        className="input"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: Number(e.target.value) })}
                                    >
                                        {categories.length === 0 && <option value="">-- Sin Categorías (Crea una primero) --</option>}
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Proveedor</label>
                                    <select
                                        className="input"
                                        value={formData.supplier_id}
                                        onChange={e => setFormData({ ...formData, supplier_id: Number(e.target.value) })}
                                    >
                                        {suppliers.length === 0 && <option value="">-- Sin Proveedores (Crea uno primero) --</option>}
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {(categories.length === 0 || suppliers.length === 0) && (
                                <div style={{
                                    backgroundColor: '#fff4e5',
                                    color: '#663c00',
                                    padding: '0.75rem',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    marginTop: '1rem',
                                    border: '1px solid #ffcc80'
                                }}>
                                    <strong>⚠️ Atención:</strong> Para crear un producto, primero debes tener registradas
                                    <strong> Categorías</strong> y <strong> Proveedores</strong>.
                                    Por favor ve a sus secciones correspondientes y crea al menos uno de cada uno.
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', width: '100%', opacity: (categories.length === 0 || suppliers.length === 0) ? 0.6 : 1 }}
                                disabled={categories.length === 0 || suppliers.length === 0}
                            >
                                {categories.length === 0 || suppliers.length === 0 ? '⛔ Faltan Datos (Categoría/Proveedor)' : 'Guardar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
