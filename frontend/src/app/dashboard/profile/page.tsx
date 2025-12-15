"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

export default function ProfilePage() {
    const { user, login } = useAuth(); // Usamos login para actualizar el estado global si cambia el usuario
    const [loading, setLoading] = useState(false);

    // Estados para Información Personal
    const [profileData, setProfileData] = useState({
        full_name: "",
        email: "",
        username: "" // Solo lectura
    });

    // Estados para Cambio de Contraseña
    const [passData, setPassData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                full_name: user.full_name || "",
                email: user.email || "",
                username: user.username || ""
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data } = await api.put("/auth/me", {
                full_name: profileData.full_name,
                email: profileData.email
            });
            alert("✅ Perfil actualizado correctamente");
            // Aquí idealmente actualizaríamos el contexto, pero por ahora basta con el alert
        } catch (error: any) {
            console.error(error);
            alert("❌ Error al actualizar perfil: " + (error.response?.data?.detail || "Error desconocido"));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new_password !== passData.confirm_password) {
            alert("⚠️ Las contraseñas nuevas no coinciden");
            return;
        }

        try {
            setLoading(true);
            await api.put("/auth/me/password", {
                current_password: passData.current_password,
                new_password: passData.new_password
            });
            alert("✅ Contraseña cambiada exitosamente");
            setPassData({ current_password: "", new_password: "", confirm_password: "" });
        } catch (error: any) {
            console.error(error);
            alert("❌ Error al cambiar contraseña: " + (error.response?.data?.detail || "Contraseña actual incorrecta"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mi Perfil</h1>

            <div className={styles.grid}>
                {/* Tarjeta de Información */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Información Personal</h2>
                    <form onSubmit={handleUpdateProfile} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Usuario (No editable)</label>
                            <input
                                className={styles.input}
                                value={profileData.username}
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Nombre Completo</label>
                            <input
                                className={styles.input}
                                value={profileData.full_name}
                                onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={profileData.email}
                                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Guardando..." : "Actualizar Información"}
                        </button>
                    </form>
                </div>

                {/* Tarjeta de Contraseña */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Seguridad</h2>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                        Cambia tu contraseña regularmente para mantener tu cuenta segura.
                    </p>
                    <form onSubmit={handleChangePassword} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Contraseña Actual</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={passData.current_password}
                                onChange={e => setPassData({ ...passData, current_password: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Nueva Contraseña</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={passData.new_password}
                                onChange={e => setPassData({ ...passData, new_password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                className={styles.input}
                                value={passData.confirm_password}
                                onChange={e => setPassData({ ...passData, confirm_password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn" style={{
                            backgroundColor: 'white',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                        }} disabled={loading}>
                            {loading ? "Procesando..." : "Cambiar Contraseña"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
