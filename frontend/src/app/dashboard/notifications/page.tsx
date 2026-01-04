"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import styles from "../products/page.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: number;
  type: "low_stock" | "out_of_stock" | "system" | "info";
  title: string;
  message: string;
  product_id?: number | null;
  is_read: boolean;
  created_at: string;
}

interface Preferences {
  low_stock_enabled: boolean;
  out_of_stock_enabled: boolean;
  email_notifications: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const fetchPrefs = async () => {
    try {
      const { data } = await api.get("/notifications/preferences/me");
      setPrefs({
        low_stock_enabled: !!data.low_stock_enabled,
        out_of_stock_enabled: !!data.out_of_stock_enabled,
        email_notifications: !!data.email_notifications,
      });
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") console.error("Error fetching prefs", err);
    }
  };

  const viewNotification = async (id: number) => {
    try {
      const { data } = await api.get(`/notifications/${id}`);
      setSelectedNotification(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo cargar la notificación.");
    }
  };

  const closeDetail = () => setSelectedNotification(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const params = unreadOnly ? "?unread_only=true" : "";
      const { data } = await api.get(`/notifications/${params}`);
      const items = Array.isArray(data) ? data : (data.items || []);
      setNotifications(items);
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") console.error("Error fetching notifications", err);
      setError(err.response?.data?.detail || "No se pudo cargar notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchPrefs();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated, unreadOnly]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo marcar como leída.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put(`/notifications/mark-all-read`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo marcar todas como leídas.");
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("¿Eliminar notificación?")) return;
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo eliminar la notificación.");
    }
  };

  const savePrefs = async () => {
    if (!prefs) return;
    try {
      const payload = {
        low_stock_enabled: prefs.low_stock_enabled,
        out_of_stock_enabled: prefs.out_of_stock_enabled,
        email_notifications: prefs.email_notifications,
      };
      const { data } = await api.put("/notifications/preferences/me", payload);
      setPrefs({
        low_stock_enabled: !!data.low_stock_enabled,
        out_of_stock_enabled: !!data.out_of_stock_enabled,
        email_notifications: !!data.email_notifications,
      });
      alert("Preferencias actualizadas");
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo guardar preferencias.");
    }
  };

  const typeBadge = (t: Notification["type"]) => {
    if (t === "out_of_stock") return { label: "Agotado", className: styles.badgeDanger };
    if (t === "low_stock") return { label: "Stock bajo", className: styles.badgeWarning };
    if (t === "system") return { label: "Sistema", className: styles.badgeSuccess };
    return { label: "Info", className: styles.badge };
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notificaciones</h1>
        <div className={styles.controls} style={{ gap: "0.75rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Solo no leídas
          </label>
          <button className="btn" onClick={markAllRead}>Marcar todas como leídas</button>
          <button className="btn btn-primary" onClick={fetchNotifications}>Actualizar</button>
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
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Mensaje</th>
              <th>Producto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Cargando...</td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Sin notificaciones.</td>
              </tr>
            ) : (
              notifications.map((n) => {
                const badge = typeBadge(n.type);
                return (
                  <tr key={n.id}>
                    <td>{new Date(n.created_at).toLocaleString()}</td>
                    <td><span className={`${styles.badge} ${badge.className}`}>{badge.label}</span></td>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td style={{ maxWidth: 520 }}>
                      {n.message.length > 50 ? n.message.substring(0, 50) + "..." : n.message}
                    </td>
                    <td>{n.product_id ?? "-"}</td>
                    <td>{n.is_read ? "Leída" : "No leída"}</td>
                    <td style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn" onClick={() => router.push(`/notifications/${n.id}`)} title="Ver detalle">
                        👁️
                      </button>
                      {!n.is_read && (
                        <button className="btn" onClick={() => markAsRead(n.id)} style={{ color: "var(--primary-color)" }} title="Marcar como leída">
                          ✔️
                        </button>
                      )}
                      <button className="btn" onClick={() => deleteNotification(n.id)} style={{ color: "var(--error-color)" }} title="Eliminar">
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedNotification && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)",
            width: "90%", maxWidth: "500px", boxShadow: "var(--shadow-lg)"
          }}>
            <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              Detalle de Notificación
            </h2>
            
            <div style={{ marginBottom: "1rem" }}>
              <span className={`${styles.badge} ${typeBadge(selectedNotification.type).className}`} style={{ marginBottom: "0.5rem", display: "inline-block" }}>
                {typeBadge(selectedNotification.type).label}
              </span>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                {new Date(selectedNotification.created_at).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Título:</strong> 
              {selectedNotification.title}
            </div>
            
            <div style={{ marginBottom: "1rem" }}>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Mensaje:</strong> 
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{selectedNotification.message}</p>
            </div>

            {selectedNotification.product_id && (
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ display: "block", marginBottom: "0.25rem" }}>ID Producto:</strong> 
                {selectedNotification.product_id}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <button className="btn btn-primary" onClick={closeDetail}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card} style={{ marginTop: "1.5rem" }}>
        <h2 className={styles.cardTitle}>Preferencias</h2>
        {prefs ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={prefs.low_stock_enabled}
                onChange={(e) =>
                  setPrefs({ ...prefs, low_stock_enabled: e.target.checked })
                }
              />
              Alertas de stock bajo
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={prefs.out_of_stock_enabled}
                onChange={(e) =>
                  setPrefs({ ...prefs, out_of_stock_enabled: e.target.checked })
                }
              />
              Alertas por producto agotado
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={prefs.email_notifications}
                onChange={(e) =>
                  setPrefs({ ...prefs, email_notifications: e.target.checked })
                }
              />
              Notificaciones por email
            </label>
            <div style={{ gridColumn: "span 3" }}>
              <button className="btn btn-primary" onClick={savePrefs}>Guardar preferencias</button>
            </div>
          </div>
        ) : (
          <div>Cargando preferencias...</div>
        )}
      </div>
    </div>
  );
}
