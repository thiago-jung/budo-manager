"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import XPBar from "@/components/XPBar";

export default function ExamesPage() {
    const [candidatos, setCandidatos] = useState<any[]>([]);

    useEffect(() => {
        // Busca alunos que ja atingiram o progresso minimo
        api.get("/alunos/candidatos-graduacao").then((res) => setCandidatos(res.data));
    }, []);

    const realizarGraduacao = async (alunoId: string, proximaGradId: string) => {
        try {
            await api.post(`/alunos/${alunoId}/graduar`, { nova_gradu_id: proximaGradId });
            alert("Graduacao realizada!");
            setCandidatos(prev => prev.filter(a => a.id !== alunoId));
        } catch (err) {
            alert("Erro ao graduar.");
        }
    };

    return (
        <div className="p-6 bg-secondary min-h-screen">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">🏆 Candidatos à Graduação</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidatos.map((aluno) => (
                    <div key={aluno.id} className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{aluno.nome}</h3>
                                <p className="text-sm text-gray-500">Faixa Atual: {aluno.faixa_nome}</p>
                            </div>
                            <span className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">PRONTO</span>
                        </div>

                        <div className="mb-6">
                            <XPBar percentual={100} aulas={aluno.total_aulas} />
                        </div>

                        <button
                            onClick={() => realizarGraduacao(aluno.id, aluno.proxima_faixa_id)}
                            className="btn-primary w-full"
                        >
                            Graduar para {aluno.proxima_faixa_nome}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}