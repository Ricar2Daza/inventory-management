"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button className={styles.menuButton} onClick={onMenuClick}>
                    ☰
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Dashboard</h2>
            </div>

            <div className={styles.userInfo}>
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
