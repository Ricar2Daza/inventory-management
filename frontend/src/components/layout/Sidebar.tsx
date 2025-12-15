"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const menuItems = [
        { label: "Dashboard", href: "/dashboard", icon: "📊" },
        { label: "Productos", href: "/dashboard/products", icon: "📦" },
        { label: "Inventario", href: "/dashboard/inventory", icon: "📉" },
        { label: "Categorías", href: "/dashboard/categories", icon: "🏷️" },
        { label: "Proveedores", href: "/dashboard/suppliers", icon: "🏢" },
        { label: "Reportes", href: "/dashboard/reports", icon: "📈" },
        { label: "Mi Perfil", href: "/dashboard/profile", icon: "👤" },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && (
                <div className={styles.mobileOverlay} onClick={onClose} />
            )}

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.logoContainer}>
                    <div style={{ width: 32, height: 32, background: 'var(--primary-color)', borderRadius: 8 }}></div>
                    <span className={styles.logoText}>Inventario App</span>
                </div>

                <nav className={styles.nav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button
                        onClick={logout}
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
