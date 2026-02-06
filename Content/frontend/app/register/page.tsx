"use client";
import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";
import * as React from "react";

export default function RegisterPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    const [formData, setFormData] = useState({
        admin_nome: "",
        admin_email: "",
        admin_senha: "",
        dojo_nome: "",
        dojo_telefone: "",
        dojo_endereco: "",
    });

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            // 1. Cria o Dojo e a conta do Professor
            await api.post("/auth/onboard", formData);

            // 2. Realiza o login automático após o registro
            await login(formData.admin_email, formData.admin_senha);

            router.push("/dashboard");
        } catch (err: any) {
            setErro(err?.response?.data?.detail || "Erro ao criar conta. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white">
                        <span className="text-accent">🥋 Budo</span>Manager
                    </h1>
                    <p className="text-white/50 mt-2 text-sm">Registre seu Dojo e comece a gerir</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Criar Conta</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados do Professor</p>
                            <input
                                type="text"
                                placeholder="Seu Nome"
                                className="input-field"
                                required
                                onChange={(e) => setFormData({ ...formData, admin_nome: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Seu Email"
                                className="input-field"
                                required
                                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Sua Senha"
                                className="input-field"
                                required
                                onChange={(e) => setFormData({ ...formData, admin_senha: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados do Dojo</p>
                            <input
                                type="text"
                                placeholder="Nome do Dojo"
                                className="input-field"
                                required
                                onChange={(e) => setFormData({ ...formData, dojo_nome: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Telefone"
                                className="input-field"
                                onChange={(e) => setFormData({ ...formData, dojo_telefone: e.target.value })}
                            />
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
                                {erro}
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                            {loading ? "Processando..." : "Finalizar Cadastro"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Já tem conta? <Link href="/login" className="text-accent font-semibold hover:underline">Faça login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}