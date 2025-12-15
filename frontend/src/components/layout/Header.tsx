"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
                <img
                    src={logoSrc}
                    alt="Octava Capa"
                    className="brand-mark"
                    style={{ width: 28, height: 28, objectFit: 'contain', marginLeft: 8, marginRight: 8 }}
                    onError={() => setLogoIndex(i => Math.min(i + 1, logoCandidates.length - 1))}
                />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{getTitle()}</h2>
            </div>

            <div className={styles.userInfo}>
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
                <div className={styles.avatar}>
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
            </div>
        </header>
    );
}
