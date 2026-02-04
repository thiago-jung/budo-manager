"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { alunosAPI, pagamentosAPI } from "@/services/api";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import * as React from "react";

// ─── Tipos ───
interface StatCard {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ size: number; className?: string }>;
    color: string;
    sub?: string;
}

// ─── Componente: Cartão de estatística ───
function Card({ title, value, icon: Icon, color, sub }: StatCard) {
    return (
        <div className="card flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Page ───
function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ alunos: 0, pagamentos: 0, inadimplentes: 0, receita: 0 });

    useEffect(() => {
        async function fetchData() {
            try {
                const [alunosRes, pagamentosRes] = await Promise.all([
                    alunosAPI.listar(),
                    pagamentosAPI.listar(),
                ]);

                const alunos = alunosRes.data;
                const pagamentos = pagamentosRes.data;
                const inadimplentes = pagamentos.filter((p: any) => p.status === "atraso").length;
                const receita = pagamentos
                    .filter((p: any) => p.status === "pago")
                    .reduce((acc: number, p: any) => acc + p.valor, 0);

                setStats({ alunos: alunos.length, pagamentos: pagamentos.length, inadimplentes, receita });
            } catch {
                // silenciar erro para não quebrar a UI
            }
        }
        fetchData();
    }, []);

    const cards: StatCard[] = [
        { title: "Alunos Ativos", value: stats.alunos, icon: Users, color: "bg-primary", sub: "cadastrados" },
        { title: "Receita Confirmada", value: `R$ ${stats.receita.toFixed(2)}`, icon: DollarSign, color: "bg-green-500", sub: "este mês" },
        { title: "Pagamentos", value: stats.pagamentos, icon: TrendingUp, color: "bg-blue-500", sub: "total" },
        { title: "Inadimplentes", value: stats.inadimplentes, icon: AlertCircle, color: "bg-amber-500", sub: "em atraso" },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-gray-400 text-sm">Bem-vindo, <span className="font-semibold text-gray-600">{user?.nome}</span></p>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card) => (
                    <Card key={card.title} {...card} />
                ))}
            </div>

            {/* Atividade recente (placeholder) */}
            <div className="card">
                <h2 className="font-semibold text-gray-700 mb-4">Atividade Recente</h2>
                <p className="text-sm text-gray-400 text-center py-8">
                    Em breve aparecerão os últimos eventos do dojo aqui.
                </p>
            </div>
        </DashboardLayout>
    );
}

export default ProtectedRoute(DashboardPage);