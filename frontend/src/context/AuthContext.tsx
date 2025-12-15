"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

// Tipos basados en tu esquema de usuario
interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Al cargar la app, verificar si hay token y usuario guardado
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    // Intentar obtener datos del usuario actual para validar token
                    // Asumiendo que existe endpoint /auth/me o similar. Si no, usamos lo almacenado.
                    // Por ahora simularemos que si hay token, intentamos recuperar la sesión
                    // Ideal: const { data } = await api.get('/auth/me'); setUser(data);

                    const savedUser = localStorage.getItem("user");
                    if (savedUser) {
                        setUser(JSON.parse(savedUser));
                    }
                } catch (error) {
                    console.error("Sesión inválida", error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        router.push("/dashboard"); // Redirigir al dashboard
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook personalizado para usar el contexto
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
