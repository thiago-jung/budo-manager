// app/context/AuthContext.tsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("usuario");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUsuario(JSON.parse(savedUser));
        }
    }, []);

    const login = (newToken: string, user: any) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("usuario", JSON.stringify(user));
        setToken(newToken);
        setUsuario(user);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider value={{ usuario, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);