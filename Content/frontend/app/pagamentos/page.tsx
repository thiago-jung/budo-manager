"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { alunosAPI, pagamentosAPI } from "@/services/api";
import { Plus, X } from "lucide-react";
import * as React from "react";

// ─── Tipos ───
interface Aluno { id: string; nome: string; }
interface Pagamento { id: string; aluno_id: string; valor: number; status: string; metodo?: string; referencia_mes?: string; criado_em: string; }

// ─── Badge de status ───
const statusStyle: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-700",
    pago: "bg-green-100 text-green-700",
    atraso: "bg-red-100 text-red-700",
    cancelado: "bg-gray-100 text-gray-500",
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyle[status] || "bg-gray-100 text-gray-500"}`}>
            {status}
        </span>
    );
}

// ─── Page ───
function PagamentosPage() {
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState({ aluno_id: "", valor: "", referencia_mes: "" });
    const [erro, setErro] = useState("");

    useEffect(() => {
        Promise.all([pagamentosAPI.listar(), alunosAPI.listar()])
            .then(([pRes, aRes]) => { setPagamentos(pRes.data); setAlunos(aRes.data); })
            .catch(() => { });
    }, []);

    // Nome do aluno por ID
    const nomeAluno = (id: string) => alunos.find((a) => a.id === id)?.nome || "—";

    // Criar pagamento
    async function handleCriar() {
        setErro("");
        if (!form.aluno_id || !form.valor) { setErro("Aluno e valor são obrigatórios."); return; }

        try {
            const res = await pagamentosAPI.criar({
                aluno_id: form.aluno_id,
                valor: parseFloat(form.valor),
                referencia_mes: form.referencia_mes || undefined,
            });
            setPagamentos((prev) => [res.data, ...prev]);
            setModalAberto(false);
            setForm({ aluno_id: "", valor: "", referencia_mes: "" });
        } catch (err: any) {
            setErro(err?.response?.data?.detail || "Erro ao criar pagamento.");
        }
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pagamentos</h1>
                    <p className="text-gray-400 text-sm">{pagamentos.length} registro(s)</p>
                </div>
                <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Nova Cobrança
                </button>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {(["pendente", "pago", "atraso"] as const).map((s) => {
                    const count = pagamentos.filter((p) => p.status === s).length;
                    const total = pagamentos.filter((p) => p.status === s).reduce((a, p) => a + p.valor, 0);
                    return (
                        <div key={s} className="card text-center">
                            <StatusBadge status={s} />
                            <p className="text-xl font-bold text-gray-800 mt-2">{count}</p>
                            <p className="text-xs text-gray-400">R$ {total.toFixed(2)}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tabela */}
            <div className="card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-400 uppercase text-xs tracking-wide">
                            <th className="pb-3 font-medium">Aluno</th>
                            <th className="pb-3 font-medium">Valor</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Ref. Mês</th>
                            <th className="pb-3 font-medium">Criado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagamentos.length === 0 && (
                            <tr><td colSpan={5} className="text-center text-gray-400 py-6">Nenhum pagamento yet.</td></tr>
                        )}
                        {pagamentos.map((p) => (
                            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-3 font-medium text-gray-800">{nomeAluno(p.aluno_id)}</td>
                                <td className="py-3 text-gray-700">R$ {p.valor.toFixed(2)}</td>
                                <td className="py-3"><StatusBadge status={p.status} /></td>
                                <td className="py-3 text-gray-400">{p.referencia_mes || "—"}</td>
                                <td className="py-3 text-gray-400">{new Date(p.criado_em).toLocaleDateString("pt-BR")}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ─── Modal: Nova Cobrança ─── */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-800">Nova Cobrança</h2>
                            <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Aluno *</label>
                                <select className="input-field" value={form.aluno_id} onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$) *</label>
                                <input className="input-field" type="number" placeholder="149.00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Referência (mês)</label>
                                <input className="input-field" type="month" value={form.referencia_mes} onChange={(e) => setForm({ ...form, referencia_mes: e.target.value })} />
                            </div>
                        </div>

                        {erro && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mt-3">{erro}</div>}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModalAberto(false)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleCriar} className="btn-primary flex-1">Criar Cobrança</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default ProtectedRoute(PagamentosPage);