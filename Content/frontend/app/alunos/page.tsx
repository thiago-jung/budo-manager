"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { alunosAPI } from "@/services/api";
import { Plus, Search, X } from "lucide-react";
import * as React from "react";

// ─── Tipos ───
interface Aluno {
    id: string;
    nome: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    faixa_atual: string;
    ativo: boolean;
    criado_em: string;
}

// ─── Cores das faixas ───
const coreFaixa: Record<string, string> = {
    Branca: "bg-gray-200 text-gray-700",
    Amarela: "bg-yellow-200 text-yellow-800",
    Laranja: "bg-orange-200 text-orange-800",
    Verde: "bg-green-200 text-green-800",
    Azul: "bg-blue-200 text-blue-800",
    Marrom: "bg-amber-700 text-white",
    Preta: "bg-gray-900 text-white",
};

// ─── Page ───
function AlunosPage() {
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState({ nome: "", cpf: "", telefone: "", email: "" });
    const [erro, setErro] = useState("");

    // Busca alunos ao montar
    useEffect(() => {
        alunosAPI.listar().then((res) => setAlunos(res.data)).catch(() => { });
    }, []);

    // Filtro de busca
    const filtrados = alunos.filter((a) =>
        a.nome.toLowerCase().includes(busca.toLowerCase())
    );

    // Criar aluno
    async function handleCriar() {
        setErro("");
        if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }

        try {
            const res = await alunosAPI.criar(form);
            setAlunos((prev) => [res.data, ...prev]);
            setModalAberto(false);
            setForm({ nome: "", cpf: "", telefone: "", email: "" });
        } catch (err: any) {
            setErro(err?.response?.data?.detail || "Erro ao criar aluno.");
        }
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Alunos</h1>
                    <p className="text-gray-400 text-sm">{alunos.length} cadastrado(s)</p>
                </div>
                <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Novo Aluno
                </button>
            </div>

            {/* Barra de busca */}
            <div className="relative mb-4 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input-field pl-9"
                />
            </div>

            {/* Tabela */}
            <div className="card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-400 uppercase text-xs tracking-wide">
                            <th className="pb-3 font-medium">Nome</th>
                            <th className="pb-3 font-medium">Telefone</th>
                            <th className="pb-3 font-medium">Faixa</th>
                            <th className="pb-3 font-medium">Desde</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center text-gray-400 py-6">
                                    Nenhum aluno encontrado.
                                </td>
                            </tr>
                        )}
                        {filtrados.map((aluno) => (
                            <tr key={aluno.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-3 font-medium text-gray-800">{aluno.nome}</td>
                                <td className="py-3 text-gray-500">{aluno.telefone || "—"}</td>
                                <td className="py-3">
                                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${coreFaixa[aluno.faixa_atual] || "bg-gray-100 text-gray-600"}`}>
                                        {aluno.faixa_atual}
                                    </span>
                                </td>
                                <td className="py-3 text-gray-400">
                                    {new Date(aluno.criado_em).toLocaleDateString("pt-BR")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Modal: Criar Aluno ─── */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        {/* Header modal */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-800">Cadastrar Aluno</h2>
                            <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Campos */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
                                <input className="input-field" placeholder="João Silva" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">CPF</label>
                                <input className="input-field" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Telefone</label>
                                <input className="input-field" placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                <input className="input-field" placeholder="joao@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>

                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mt-3">
                                {erro}
                            </div>
                        )}

                        {/* Botões */}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModalAberto(false)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleCriar} className="btn-primary flex-1">Cadastrar</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default ProtectedRoute(AlunosPage);