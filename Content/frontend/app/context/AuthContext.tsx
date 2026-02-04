"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../services/api";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  dojo_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("budo_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("budo_user");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, senha: string) {
    const response = await authAPI.login(email, senha);
    const { access_token, usuario } = response.data;
    localStorage.setItem("budo_token", access_token);
    localStorage.setItem("budo_user", JSON.stringify(usuario));
    setUser(usuario);
  }

  function logout() {
    localStorage.removeItem("budo_token");
    localStorage.removeItem("budo_user");
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
