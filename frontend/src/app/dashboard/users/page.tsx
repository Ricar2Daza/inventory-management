"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "manager" | "employee";
  full_name?: string;
  is_active?: boolean;
}

const initialForm = {
  username: "",
  email: "",
  password: "",
  role: "employee" as User["role"],
  full_name: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const { data } = await api.get("/auth/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const items = Array.isArray(data) ? data : (data.items || []);
      setUsers(items);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.replace("/login");
        return;
      }
      const msg = err.response?.status === 403
        ? "Acceso restringido: solo administradores pueden listar usuarios."
        : (err.response?.data?.detail || "No se pudo obtener la lista de usuarios.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      setError("Acceso restringido: solo administradores pueden listar usuarios.");
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [user]);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: "",
        role: user.role,
        full_name: user.full_name || "",
      });
    } else {
      setEditingUser(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar usuario?")) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || "No se pudo eliminar el usuario.";
      alert(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          full_name: formData.full_name,
        };
        const { data } = await api.put(`/auth/users/${editingUser.id}`, payload);
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const payload = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          full_name: formData.full_name,
        };
        await api.post("/auth/register", payload);
        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || "No se pudo guardar el usuario.";
      alert(msg);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Usuarios</h1>
        <div className={styles.controls}>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "var(--error-light)",
            border: "1px solid var(--error-color)",
            color: "var(--error-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  Cargando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  No hay usuarios.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {u.username}
                  </td>
                  <td>{u.full_name || "-"}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                  <td>{u.is_active ? "Sí" : "No"}</td>
                  <td style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn"
                      onClick={() => handleOpenModal(u)}
                      style={{ color: "var(--primary-color)" }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(u.id)}
                      style={{ color: "var(--error-color)" }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsModalOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
              <button onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label className="text-sm font-medium">Usuario*</label>
                <input
                  className="input"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <input
                  className="input"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className="text-sm font-medium">Email*</label>
                <input
                  className="input"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              {!editingUser && (
                <div style={{ gridColumn: "span 2" }}>
                  <label className="text-sm font-medium">Contraseña*</label>
                  <input
                    className="input"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              )}
              <div style={{ gridColumn: "span 2" }}>
                <label className="text-sm font-medium">Rol*</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as User["role"],
                    })
                  }
                >
                  <option value="employee">Empleado</option>
                  <option value="manager">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div style={{ gridColumn: "span 2", display: "flex", gap: "0.75rem" }}>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
