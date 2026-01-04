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
                    // Validar token y obtener datos frescos del usuario
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                    // Actualizar usuario guardado por si acaso
                    localStorage.setItem("user", JSON.stringify(data));
                } catch (error) {
                    if (process.env.NODE_ENV !== "production") console.error("Sesión inválida", error);
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
        window.location.replace("/dashboard");
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
