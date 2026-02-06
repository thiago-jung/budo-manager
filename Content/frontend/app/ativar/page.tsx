"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/services/api";
import * as React from "react";

export default function AtivarContaPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const alunoId = searchParams.get("id"); // Pega o ID da URL (?id=...)

    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

    const handleAtivar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (senha !== confirmacao) {
            setMensagem({ tipo: "erro", texto: "As senhas não coincidem." });
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/ativar-conta", {
                aluno_id: alunoId,
                senha: senha,
                confirmacao_senha: confirmacao
            });
            setMensagem({ tipo: "sucesso", texto: "Conta ativada! Redirecionando para login..." });
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: any) {
            setMensagem({ tipo: "erro", texto: err.response?.data?.detail || "Erro ao ativar conta." });
        } finally {
            setLoading(false);
        }
    };

    if (!alunoId) return <div className="text-white text-center mt-20">Link de ativação inválido.</div>;

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ativar sua Conta</h2>
                <p className="text-gray-500 mb-6 text-sm">Defina sua senha para acessar o painel do aluno.</p>

                <form onSubmit={handleAtivar} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Nova Senha"
                        className="input-field"
                        required
                        onChange={(e) => setSenha(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirme a Senha"
                        className="input-field"
                        required
                        onChange={(e) => setConfirmacao(e.target.value)}
                    />

                    {mensagem.texto && (
                        <div className={`p-3 rounded-lg text-sm ${mensagem.tipo === "erro" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {mensagem.texto}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? "Ativando..." : "Ativar Conta"}
                    </button>
                </form>
            </div>
        </div>
    );
}