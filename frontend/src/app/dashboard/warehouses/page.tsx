"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { useAuth } from "@/context/AuthContext";

interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  capacity?: number | null;
  manager_name?: string | null;
  phone?: string | null;
  is_active: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface ProductWarehouse {
  id: number;
  product_id: number;
  warehouse_id: number;
  stock: number;
  min_stock_level: number;
}

export default function WarehousesPage() {
  const { user, isAuthenticated } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<ProductWarehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    capacity: "",
    manager_name: "",
    phone: "",
  });

  const [assignData, setAssignData] = useState({
    product_id: "",
    stock: "0",
    min_stock_level: "0",
  });

  const [transferData, setTransferData] = useState({
    product_id: "",
    from_warehouse_id: "",
    to_warehouse_id: "",
    quantity: "0",
    reason: "",
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/warehouses/?active_only=true&limit=100");
      setWarehouses(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo cargar almacenes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (warehouseId: number) => {
    try {
      const { data } = await api.get(`/warehouses/${warehouseId}/inventory`);
      setInventory(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo cargar inventario del almacén.");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products/?limit=200");
      const items = Array.isArray(data) ? data : data.items || [];
      setProducts(items.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchWarehouses();
    fetchProducts();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selected) fetchInventory(selected.id);
  }, [selected]);

  const handleOpenModal = (w: Warehouse | null = null) => {
    if (w) {
      setEditing(w);
      setFormData({
        name: w.name || "",
        code: w.code || "",
        address: w.address || "",
        capacity: w.capacity != null ? String(w.capacity) : "",
        manager_name: w.manager_name || "",
        phone: w.phone || "",
      });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        code: "",
        address: "",
        capacity: "",
        manager_name: "",
        phone: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin") {
      alert("Acción restringida a administradores.");
      return;
    }
    try {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        address: formData.address || null,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        manager_name: formData.manager_name || null,
        phone: formData.phone || null,
      };
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, payload);
      } else {
        await api.post(`/warehouses/`, payload);
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al guardar almacén.");
    }
  };

  const handleDeleteWarehouse = async (id: number) => {
    if (user?.role !== "admin") {
      alert("Acción restringida a administradores.");
      return;
    }
    if (!confirm("¿Eliminar almacén?")) return;
    try {
      await api.delete(`/warehouses/${id}`);
      if (selected?.id === id) setSelected(null);
      fetchWarehouses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo eliminar el almacén.");
    }
  };

  const handleAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin") {
      alert("Acción restringida a administradores.");
      return;
    }
    if (!selected) return;
    if (!assignData.product_id) {
      alert("Seleccione un producto.");
      return;
    }
    try {
      await api.post(`/warehouses/inventory`, {
        product_id: Number(assignData.product_id),
        warehouse_id: selected.id,
        stock: Number(assignData.stock || "0"),
        min_stock_level: Number(assignData.min_stock_level || "0"),
      });
      setAssignData({ product_id: "", stock: "0", min_stock_level: "0" });
      fetchInventory(selected.id);
      alert("Producto asignado.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo asignar el producto.");
    }
  };

  const handleUpdatePW = async (pw: ProductWarehouse, changes: Partial<ProductWarehouse>) => {
    if (user?.role !== "admin") {
      alert("Acción restringida a administradores.");
      return;
    }
    try {
      await api.put(`/warehouses/inventory/${pw.id}`, {
        stock: changes.stock != null ? changes.stock : pw.stock,
        min_stock_level: changes.min_stock_level != null ? changes.min_stock_level : pw.min_stock_level,
      });
      if (selected) fetchInventory(selected.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo actualizar el stock.");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== "admin") {
      alert("Acción restringida a administradores.");
      return;
    }
    if (!transferData.product_id || !transferData.from_warehouse_id || !transferData.to_warehouse_id) {
      alert("Complete todos los campos.");
      return;
    }
    if (transferData.from_warehouse_id === transferData.to_warehouse_id) {
      alert("El origen y destino deben ser diferentes.");
      return;
    }
    try {
      await api.post(`/warehouses/transfer`, {
        product_id: Number(transferData.product_id),
        from_warehouse_id: Number(transferData.from_warehouse_id),
        to_warehouse_id: Number(transferData.to_warehouse_id),
        quantity: Number(transferData.quantity || "0"),
        reason: transferData.reason || null,
      });
      if (selected) fetchInventory(selected.id);
      alert("Transferencia realizada.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo realizar la transferencia.");
    }
  };

  const productName = (id: number) => {
    const p = products.find((x) => x.id === id);
    return p ? `${p.name} (${p.sku})` : `#${id}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Almacenes</h1>
        <div className={styles.controls}>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Nuevo Almacén</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>Listado</h2>
          </div>
          {loading ? (
            <div style={{ padding: "1rem" }}>Cargando...</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Capacidad</th>
                    <th>Encargado</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "1.5rem" }}>Sin almacenes.</td></tr>
                  ) : (
                    warehouses.map((w) => (
                      <tr
                        key={w.id}
                        style={{ backgroundColor: selected?.id === w.id ? "var(--bg-primary)" : undefined }}
                      >
                        <td style={{ cursor: "pointer" }} onClick={() => setSelected(w)}>{w.name}</td>
                        <td>{w.code}</td>
                        <td>{w.capacity ?? "-"}</td>
                        <td>{w.manager_name ?? "-"}</td>
                        <td>{w.is_active ? "Activo" : "Inactivo"}</td>
                        <td style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn" onClick={() => handleOpenModal(w)}>✏️</button>
                          <button className="btn" onClick={() => handleDeleteWarehouse(w.id)} style={{ color: "var(--error-color)" }}>🗑️</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
              Inventario {selected ? `de ${selected.name}` : ""}
            </h2>
            {!selected ? (
              <div style={{ padding: "1rem" }}>Seleccione un almacén.</div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: "center", padding: "1.5rem" }}>Sin productos.</td></tr>
                    ) : (
                      inventory.map((pw) => (
                        <tr key={pw.id}>
                          <td>{productName(pw.product_id)}</td>
                          <td>
                            <input
                              type="number"
                              className="input"
                              style={{ width: 100 }}
                              defaultValue={pw.stock}
                              onBlur={(e) => handleUpdatePW(pw, { stock: Number(e.target.value) })}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input"
                              style={{ width: 100 }}
                              defaultValue={pw.min_stock_level}
                              onBlur={(e) => handleUpdatePW(pw, { min_stock_level: Number(e.target.value) })}
                            />
                          </td>
                          <td>
                            <button className="btn" onClick={() => handleUpdatePW(pw, {})}>Guardar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Asignar producto</h2>
            <form onSubmit={handleAssignProduct} style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end" }}>
              <div>
                <label className="text-sm font-medium">Producto</label>
                <select
                  className="input"
                  value={assignData.product_id}
                  onChange={(e) => setAssignData({ ...assignData, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div style={{ minWidth: 180 }}>
                <label className="text-sm font-medium">Stock</label>
                <input
                  type="number"
                  className="input"
                  value={assignData.stock}
                  onChange={(e) => setAssignData({ ...assignData, stock: e.target.value })}
                />
              </div>
              <div style={{ minWidth: 180 }}>
                <label className="text-sm font-medium">Mínimo</label>
                <input
                  type="number"
                  className="input"
                  value={assignData.min_stock_level}
                  onChange={(e) => setAssignData({ ...assignData, min_stock_level: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">Asignar</button>
            </form>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Transferir stock</h2>
            <form onSubmit={handleTransfer} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
              <div>
                <label className="text-sm font-medium">Producto</label>
                <select
                  className="input"
                  value={transferData.product_id}
                  onChange={(e) => setTransferData({ ...transferData, product_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Cantidad</label>
                <input
                  type="number"
                  className="input"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Desde</label>
                <select
                  className="input"
                  value={transferData.from_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Hacia</label>
                <select
                  className="input"
                  value={transferData.to_warehouse_id}
                  onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className="text-sm font-medium">Motivo</label>
                <input
                  className="input"
                  value={transferData.reason}
                  onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" className="btn btn-primary">Transferir</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>{editing ? "Editar Almacén" : "Nuevo Almacén"}</h3>
            <form onSubmit={handleSubmitWarehouse} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Nombre</label>
                <input
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Código</label>
                <input
                  className="input"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Dirección</label>
                <input
                  className="input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Capacidad</label>
                <input
                  type="number"
                  className="input"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Encargado</label>
                <input
                  className="input"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Teléfono</label>
                <input
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? "Guardar" : "Crear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
