"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { theme } = useTheme();
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
    const [navBusy, setNavBusy] = useState(false);
    const logoSrc = logoCandidates[logoIndex];
 
    type Role = "admin" | "manager" | "employee";
    type MenuItem = { label: string; href: string; icon: string; roles: Role[] };
 
    const baseMenu: MenuItem[] = [
        { label: "Dashboard", href: "/dashboard", icon: "📊", roles: ["admin", "manager", "employee"] },
        { label: "Ventas (POS)", href: "/dashboard/pos", icon: "🛒", roles: ["admin", "manager", "employee"] },
        { label: "Productos", href: "/dashboard/products", icon: "📦", roles: ["admin", "manager", "employee"] },
        { label: "Inventario", href: "/dashboard/inventory", icon: "📉", roles: ["admin", "manager", "employee"] },
        { label: "Categorías", href: "/dashboard/categories", icon: "🏷️", roles: ["admin", "manager"] },
        { label: "Proveedores", href: "/dashboard/suppliers", icon: "🏢", roles: ["admin", "manager"] },
        { label: "Almacenes", href: "/dashboard/warehouses", icon: "🏬", roles: ["admin", "manager"] },
        { label: "Clientes", href: "/dashboard/clients", icon: "👤", roles: ["admin", "manager"] },
        { label: "Gastos", href: "/dashboard/expenses", icon: "💸", roles: ["admin", "manager"] },
        { label: "Reportes", href: "/dashboard/reports", icon: "📈", roles: ["admin", "manager"] },
    ];
    const role: Role = (user?.role as Role) || "employee";
    const menuItems = baseMenu.filter(item => item.roles.includes(role));

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div className={styles.mobileOverlay} onClick={onClose} />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logoContainer}>
                    <Image
                        src={logoSrc}
                        alt="Octava Capa"
                        className="brand-mark"
                        width={36}
                        height={36}
                        style={{ objectFit: 'contain', borderRadius: 8 }}
                        onError={() => setLogoIndex(i => Math.min(i + 1, logoCandidates.length - 1))}
                    />
                    <span className={`${styles.logoText} brand-text-hide`}>Octava Capa</span>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={false}
                            onClick={() => {
                                if (navBusy) return;
                                setNavBusy(true);
                                onClose();
                                setTimeout(() => setNavBusy(false), 600);
                            }}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button
                        onClick={() => { onClose(); logout(); }}
                        className={styles.navItem}
                        style={{ width: '100%', color: 'var(--error-color)' }}
                    >
                        <span>🚪</span>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
