"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";
import api from "@/services/api";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Obtener Token (OAuth2 Password Flow)
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const { data: tokenData } = await api.post("/auth/login", formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // 2. Obtener datos del usuario (opcional, si el login no los devuelve)
            // Por ahora simularemos datos básicos con el username
            const user = {
                id: 0, // El ID real debería venir del backend
                username: username,
                email: "user@example.com", // Placeholder
                role: "employee" // Placeholder
            };

            // Si tuvieras un endpoint /auth/me, lo llamaríamos aquí:
            // const { data: userData } = await api.get('/auth/me', { 
            //   headers: { Authorization: `Bearer ${tokenData.access_token}` } 
            // });

            login(tokenData.access_token, user);

        } catch (err: any) {
            console.error("Login error", err);
            if (err.response?.status === 401) {
                setError("Usuario o contraseña incorrectos.");
            } else if (err.response?.status === 422) {
                setError("Datos inválidos. Revisa los campos.");
            } else {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Bienvenido</h1>
                    <p className={styles.subtitle}>Ingresa tus credenciales para continuar</p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Usuario
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? "Iniciando sesión..." : "Ingresar"}
                    </button>
                </form>
            </div>
        </div>
    );
}
