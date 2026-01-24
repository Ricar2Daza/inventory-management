"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/services/api";

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const logoCandidates = theme === "dark"
        ? [
            "/logo-octava-capa-remove.png",
            "/logo-octava-capa.png",
            "/logo-octava-capa.jpg",
            "/logo-octava-capa.png.png",
            "/logo-octava-capa.jpg.png",
            "/globe.svg"
        ]
        : [
            "/logo-octava-capa.png",
            "/logo-octava-capa-remove.png",
            "/logo-octava-capa.jpg",
            "/logo-octava-capa.png.png",
            "/logo-octava-capa.jpg.png",
            "/globe.svg"
        ];
    const [logoIndex, setLogoIndex] = useState(0);
    const logoSrc = logoCandidates[logoIndex];
    const [navBusy, setNavBusy] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [openNotif, setOpenNotif] = useState(false);
    const [preview, setPreview] = useState<Array<{ id: number; title: string; type: string; is_read: boolean; created_at: string }>>([]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const { data } = await api.get("/notifications/unread-count");
                if (mounted) setUnreadCount(Number(data?.unread_count || 0));
            } catch {
                // ignore
            }
        };
        load();
        const t = setInterval(load, 30000);
        return () => { mounted = false; clearInterval(t); };
    }, []);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                const { data } = await api.get("/notifications/?limit=5&unread_only=true");
                const items = (Array.isArray(data) ? data : (data.items || [])) as Array<{
                    id: number;
                    title: string;
                    type: string;
                    is_read?: boolean;
                    created_at: string;
                }>;
                setPreview(items.map((n) => ({
                    id: n.id,
                    title: n.title,
                    type: n.type,
                    is_read: !!n.is_read,
                    created_at: n.created_at
                })));
            } catch {
                setPreview([]);
            }
        };
        if (openNotif) loadPreview();
    }, [openNotif]);

    const getTitle = () => {
        if (!pathname) return "Dashboard";
        const seg = pathname.replace(/^\/+/, "").split("/");
        if (seg[0] !== "dashboard") return "Inicio";
        const mod = seg[1] || "dashboard";
        const map: Record<string, string> = {
            dashboard: "Dashboard",
            products: "Productos",
            inventory: "Inventario",
            categories: "Categorías",
            suppliers: "Proveedores",
            warehouses: "Almacenes",
            notifications: "Notificaciones",
            users: "Usuarios",
            reports: "Reportes",
            profile: "Mi Perfil",
        };
        return map[mod] || "Dashboard";
    };

    return (
        <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button className={styles.menuButton} onClick={onMenuClick}>
                    ☰
                </button>
                <Image
                    src={logoSrc}
                    alt="Octava Capa"
                    className="brand-mark"
                    width={28}
                    height={28}
                    style={{ objectFit: 'contain', marginLeft: 8, marginRight: 8 }}
                    onError={() => setLogoIndex(i => Math.min(i + 1, logoCandidates.length - 1))}
                />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }} className="brand-text-hide">{getTitle()}</h2>
            </div>

            <div className={styles.userInfo}>
                <div
                    style={{ position: "relative" }}
                    onMouseEnter={() => setOpenNotif(true)}
                    onMouseLeave={() => setOpenNotif(false)}
                >
                    <Link
                        href="/dashboard/notifications"
                        prefetch={false}
                        className={styles.profileButton}
                        style={{
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--surface-color)",
                            padding: 0
                        }}
                        onClick={() => {
                            if (navBusy) return;
                            setNavBusy(true);
                            setTimeout(() => setNavBusy(false), 600);
                        }}
                        title="Notificaciones"
                    >
                        🔔
                    </Link>
                    {unreadCount > 0 ? (
                        <span
                            style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                backgroundColor: "var(--error-color)",
                                color: "#fff",
                                borderRadius: 9999,
                                fontSize: 10,
                                padding: "2px 6px",
                                border: "2px solid var(--surface-color)"
                            }}
                        >
                            {unreadCount}
                        </span>
                    ) : null}
                    {openNotif ? (
                        <div className={styles.notifDropdown}>
                            <div style={{ padding: "0.75rem 1rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)" }}>Notificaciones</div>
                            <div>
                                {preview.length === 0 ? (
                                    <div style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>Sin nuevas notificaciones</div>
                                ) : (
                                    preview.map((n) => (
                                        <div key={n.id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)" }}>
                                            <span style={{ fontSize: 14 }}>{n.title}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div style={{ padding: "0.5rem 1rem", display: "flex", justifyContent: "flex-end", backgroundColor: "var(--bg-primary)" }}>
                                <Link href="/dashboard/notifications" prefetch={false} className={styles.profileButton} style={{ width: 'auto' }}>
                                    Ver todas
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
                <button
                    aria-label="Toggle theme"
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    {theme === "dark" ? "🌙" : "☀️"}
                </button>
                <Link
                    href="/dashboard/profile"
                    prefetch={false}
                    className={styles.profileButton}
                    onClick={() => {
                        if (navBusy) return;
                        setNavBusy(true);
                        setTimeout(() => setNavBusy(false), 600);
                    }}
                >
                    Mi Perfil
                </Link>
                <div className={styles.userDetails}>
                    <span className={styles.userName}>{user?.username || "Usuario"}</span>
                    <span className={styles.userRole}>{user?.role || "Rol"}</span>
                </div>
                {user?.role === "admin" ? (
                    <Link
                        href="/dashboard/users"
                        prefetch={false}
                        className={styles.avatar}
                        onClick={() => {
                            if (navBusy) return;
                            setNavBusy(true);
                            setTimeout(() => setNavBusy(false), 600);
                        }}
                        title="Gestionar usuarios"
                    >
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                    </Link>
                ) : (
                    <div className={styles.avatar}>
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}
            </div>
        </header>
    );
}
