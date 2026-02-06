"use client";
import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            await login(email, senha);
            router.push("/dashboard");
        } catch (err: any) {
            setErro(err?.response?.data?.detail || "Erro ao fazer login.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white">
                        <span className="text-accent">🥋 Budo</span>Manager
                    </h1>
                    <p className="text-white/50 mt-2 text-sm">Sistema de gestão para dojos</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="professor@dojo.com"
                                className="input-field"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••"
                                className="input-field"
                                required
                            />
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                                {erro}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        É um professor? <Link href="/register" className="text-accent font-semibold hover:underline">Registre seu Dojo aqui</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}