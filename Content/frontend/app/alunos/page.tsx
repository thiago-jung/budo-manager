"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { alunosAPI } from "@/services/api";
import api from "@/services/api";
import { Plus, Search, X, Settings2, Award } from "lucide-react";
import * as React from "react";
import BackButton from "@/components/BackButton";
import { toast } from 'react-hot-toast';

// ─── Tipos ───
interface Aluno {
    id: string;
    nome: string;
    cpf?: string;
    telefone?: string;
    email?: string;
    faixa_atual: string;
    data_nascimento?: string;
    data_inicio: string;
    graduacao_id?: string;
    ativo: boolean;
    criado_em: string;
}

// ─── Cores das faixas (Fallback caso não venha do BD) ───
const coreFaixa: Record<string, string> = {
    Branca: "bg-gray-200 text-gray-700",
    Amarela: "bg-yellow-200 text-yellow-800",
    Laranja: "bg-orange-200 text-orange-800",
    Verde: "bg-green-200 text-green-800",
    Azul: "bg-blue-200 text-blue-800",
    Marrom: "bg-amber-700 text-white",
    Preta: "bg-gray-900 text-white",
};

function AlunosPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [alunos, setAlunos] = useState<Aluno[]>([]);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [form, setForm] = useState({
        nome: "",
        cpf: "",
        telefone: "",
        email: "",
        data_nascimento: "", // Adicionado
        data_inicio: new Date().toISOString().split('T')[0] // Default: Hoje
    });
    const [erro, setErro] = useState("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
    const [graduacoes, setGraduacoes] = useState<any[]>([]);

    // Função para calcular a idade dinamicamente
    const calcularIdade = (dataNasc: string | undefined) => {
        if (!dataNasc) return "—";
        const hoje = new Date();
        const nasc = new Date(dataNasc);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        return idade;
    };

    useEffect(() => {
        if (!loading && user?.role === "aluno") {
            router.push("/aluno/dashboard");
        }
    }, [user, loading, router]);

    // Carregar dados iniciais
    useEffect(() => {
        carregarAlunos();
        carregarGraduacoes();
    }, []);

    const carregarAlunos = () => {
        alunosAPI.listar()
            .then((res) => setAlunos(res.data))
            .catch(() => { });
    };

    const carregarGraduacoes = () => {
        api.get("/dojos/graduacoes")
            .then(res => setGraduacoes(res.data))
            .catch(() => { });
    };

    const filtrados = alunos.filter((a) =>
        a.nome.toLowerCase().includes(busca.toLowerCase())
    );

    async function handleCriar() {
        setErro("");
        if (!form.nome.trim()) { setErro("Nome é obrigatório."); return; }
        try {
            const res = await alunosAPI.criar(form);
            setAlunos((prev) => [res.data, ...prev]);
            setModalAberto(false);
            setForm({
                nome: "", cpf: "", telefone: "", email: "",
                data_nascimento: "", data_inicio: new Date().toISOString().split('T')[0]
            });
            toast.success("Aluno cadastrado com sucesso!"); // Substitui alerta
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Erro ao criar aluno.");
        }
    }

    const handleEditClick = (aluno: Aluno) => {
        setSelectedAluno({ ...aluno });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAluno) return;
        try {
            await api.put(`/alunos/${selectedAluno.id}`, selectedAluno);
            setIsEditModalOpen(false);
            carregarAlunos();
        } catch (err) {
            alert("Erro ao salvar alterações");
        }
    };

    const handleGraduar = async (alunoId: string) => {
        const aluno = alunos.find(a => a.id === alunoId);
        if (!aluno) return;

        // Encontra a posição atual na lista de graduações do dojo
        const indexAtual = graduacoes.findIndex(g => g.id === aluno.graduacao_id);
        const proxima = graduacoes[indexAtual + 1];

        if (!proxima) {
            alert("Este aluno já está na graduação máxima configurada!");
            return;
        }

        if (!confirm(`Deseja graduar ${aluno.nome} para ${proxima.nome}?`)) return;

        try {
            await api.post(`/alunos/${alunoId}/graduar`, { nova_gradu_id: proxima.id });
            toast.success("Aluno cadastrado com sucesso!"); // Substitui alerta
            carregarAlunos();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erro ao criar aluno.");
        }
    };

    return (

        <DashboardLayout>
            <BackButton />
            <div className="flex items-center justify-between mb-6 mt-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Alunos</h1>
                    <p className="text-gray-400 text-sm">{alunos.length} cadastrados</p>
                </div>
                <button onClick={() => setModalAberto(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={16} /> Novo Aluno
                </button>
            </div>

            <div className="relative mb-4 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar aluno..." value={busca} onChange={(e) => setBusca(e.target.value)} className="input-field pl-9" />
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 text-left text-gray-400 uppercase text-[10px] font-black tracking-widest">
                            <th className="py-4 px-4">Nome / Idade</th>
                            <th className="py-4 px-4">WhatsApp</th>
                            <th className="py-4 px-4">Faixa</th>
                            <th className="py-4 px-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.map((aluno) => (
                            <tr key={aluno.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="font-bold text-gray-800">{aluno.nome}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{calcularIdade(aluno.data_nascimento)} anos</div>
                                </td>
                                <td className="py-3 px-4 text-gray-600 font-medium">{aluno.telefone || "—"}</td>
                                <td className="py-3 px-4">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase italic ${coreFaixa[aluno.faixa_atual] || "bg-gray-100"}`}>
                                        {aluno.faixa_atual}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex justify-center gap-3">
                                        <button onClick={() => handleGraduar(aluno.id)} title="Graduar" className="text-gray-400 hover:text-accent transition-colors"><Award size={18} /></button>
                                        <button onClick={() => { setSelectedAluno({ ...aluno }); setIsEditModalOpen(true); }} title="Editar" className="text-gray-400 hover:text-secondary transition-colors"><Settings2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL: CRIAR ALUNO */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-5">Cadastrar Aluno</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="label-budo">Nome Completo</label>
                                <input className="input-field" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                            </div>

                            <div>
                                <label className="label-budo">CPF (Opcional)</label>
                                <input className="input-field" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-budo">Data de Nascimento</label>
                                    <input
                                        type="date" className="input-field"
                                        value={form.data_nascimento}
                                        onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label-budo">Data de Entrada</label>
                                    <input
                                        type="date" className="input-field"
                                        value={form.data_inicio}
                                        onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label-budo">WhatsApp / Telefone</label>
                                <input className="input-field" placeholder="(XX) XXXXX-XXXX" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setModalAberto(false)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleCriar} className="btn-primary flex-1">Cadastrar</button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL: EDITAR ALUNO */}
            {isEditModalOpen && selectedAluno && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-black text-secondary uppercase italic mb-6">Editar Aluno</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome</label>
                                <input className="input-field" value={selectedAluno.nome} onChange={(e) => setSelectedAluno({ ...selectedAluno, nome: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Faixa / Graduação</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                                        value={selectedAluno.faixa_atual}
                                        onChange={(e) => setSelectedAluno({ ...selectedAluno, faixa_atual: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {/* Tenta listar as faixas dinâmicas do dojo */}
                                        {graduacoes.length > 0 ? (
                                            graduacoes.map(g => (
                                                <option key={g.id} value={g.nome}>{g.nome}</option>
                                            ))
                                        ) : (
                                            // Fallback caso não existam graduações configuradas
                                            Object.keys(coreFaixa).map(faixa => (
                                                <option key={faixa} value={faixa}>{faixa}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Telefone</label>
                                    <input className="input-field" value={selectedAluno.telefone || ""} onChange={(e) => setSelectedAluno({ ...selectedAluno, telefone: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-accent text-secondary py-4 rounded-2xl font-black uppercase italic hover:scale-[1.02] transition-all">
                                Salvar Alterações
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default ProtectedRoute(AlunosPage);