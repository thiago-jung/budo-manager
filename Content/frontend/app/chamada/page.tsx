"use client";
import { useState, useEffect } from "react";
import api from "@/services/api";
import * as React from "react";

export default function ChamadaPage() {
    const [alunos, setAlunos] = useState<any[]>([]);
    const [presencas, setPresencas] = useState<{ [key: string]: boolean }>({});
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Carregar alunos do Dojo ao abrir a página
    useEffect(() => {
        api.get("/alunos/").then((res) => {
            setAlunos(res.data);
            // Inicializa todos como presentes por padrão
            const init: any = {};
            res.data.forEach((a: any) => init[a.id] = true);
            setPresencas(init);
        });
    }, []);

    const togglePresenca = (id: string) => {
        setPresencas(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const salvarChamada = async () => {
        setLoading(true);
        const payload = {
            data: new Date(data).toISOString(),
            lista_presenca: Object.entries(presencas).map(([id, pres]) => ({
                aluno_id: id,
                presente: pres
            }))
        };

        try {
            await api.post("/presencas/bulk", payload);
            alert("Chamada salva!");
        } catch (err) {
            alert("Erro ao salvar chamada.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-secondary min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">🥋 Realizar Chamada</h1>
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="border rounded-lg p-2 text-gray-700 focus:ring-accent"
                    />
                </div>

                <div className="space-y-3">
                    {alunos.map((aluno) => (
                        <div
                            key={aluno.id}
                            onClick={() => togglePresenca(aluno.id)}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${presencas[aluno.id] ? "border-green-500 bg-green-50" : "border-red-200 bg-gray-50 opacity-60"
                                }`}
                        >
                            <span className="font-medium text-gray-800">{aluno.nome}</span>
                            <div className={`px-4 py-1 rounded-full text-xs font-bold text-white ${presencas[aluno.id] ? "bg-green-500" : "bg-red-500"
                                }`}>
                                {presencas[aluno.id] ? "PRESENTE" : "AUSENTE"}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={salvarChamada}
                    disabled={loading}
                    className="btn-primary w-full mt-10 h-14 text-lg"
                >
                    {loading ? "A guardar..." : "Finalizar Chamada"}
                </button>
            </div>
        </div>
    );
}