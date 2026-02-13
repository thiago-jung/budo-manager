"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api, { eventosAPI } from "@/services/api";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import { Shield, Zap, Target, ArrowRight, Trophy } from "lucide-react";
import { toast } from "react-hot-toast";

function AlunoDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [financeiro, setFinanceiro] = useState<any[]>([]);
    const [eventosPublicos, setEventosPublicos] = useState<any[]>([]);
    const [inscritoLoading, setInscritoLoading] = useState<string | null>(null);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<{ [eventoId: string]: string }>({});

    // 1. Carregar Dados Iniciais e Feed de Eventos
    useEffect(() => {
        if (user) {
            Promise.all([
                api.get("/alunos/meu-progresso"),
                api.get("/pagamentos/meus"),
                eventosAPI.listarFeed() // Carrega as competições abertas
            ]).then(([prog, pag, ev]) => {
                setStats(prog.data);
                setFinanceiro(pag.data);
                setEventosPublicos(ev.data);
            }).catch(() => {
                toast.error("Erro ao carregar dados do dashboard.");
            });
        }
    }, [user]);

    // 2. Lógica de Inscrição Profissional
    const handleInscricao = async (evento: any) => {
        const catId = categoriaSelecionada[evento.id];
        
        if (evento.tipo === 'publico' && !catId) {
            toast.error("Selecione uma categoria para competir.");
            return;
        }

        if (!confirm(`Confirmar inscrição em "${evento.titulo}" por R$ ${evento.valor_inscricao.toFixed(2)}?`)) return;

        setInscritoLoading(evento.id);
        try {
            const res = await eventosAPI.inscrever(evento.id, catId);
            const { payment_url } = res.data;

            if (payment_url) {
                toast.success("Inscrição recebida! Pague para confirmar sua vaga.");
                window.open(payment_url, "_blank");
            } else {
                toast.success("Inscrição realizada com sucesso!");
            }

            const ev = await eventosAPI.listarFeed();
            setEventosPublicos(ev.data);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao processar inscrição.");
        } finally {
            setInscritoLoading(null);
        }
    };

    const pendentes = financeiro.filter(p => p.status !== 'pago').length;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            {/* Header com Faixa */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 border-b-[12px] border-accent relative overflow-hidden">
                <div className="w-32 h-32 bg-secondary rounded-3xl flex items-center justify-center text-5xl shadow-inner border-4 border-gray-100">
                    🥋
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-black text-secondary uppercase italic leading-none">
                        {user?.nome?.split(' ')[0] || "Combatente"}
                    </h1>
                    <p className="text-accent font-black tracking-[0.2em] mt-2">
                        FAIXA {stats?.faixa_nome?.toUpperCase() || "BRANCA"}
                    </p>
                </div>
            </div>

            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CardAtributo
                    titulo="Resistência"
                    sub="Treinos Totais"
                    valor={stats?.total_aulas || 0}
                    icon={<Shield className="text-blue-500" />}
                    href="/aluno/progresso#historico"
                    cor="border-blue-500"
                />
                <CardAtributo
                    titulo="Foco (XP)"
                    sub="Próximo Nível"
                    valor={`${stats?.progresso_percentual?.toFixed(0) || 0}%`}
                    icon={<Zap className="text-accent" />}
                    href="/aluno/progresso#graduacao"
                    cor="border-accent"
                />
                <CardAtributo
                    titulo="Tesouraria"
                    sub="Contas Pendentes"
                    valor={pendentes}
                    icon={<Target className="text-red-500" />}
                    href="/aluno/pagamentos"
                    cor="border-red-500"
                />
            </div>

            {/* Feed de Eventos Públicos */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-l-8 border-accent">
                <h3 className="text-xl font-black text-secondary uppercase italic mb-4 flex items-center gap-2">
                    <Trophy className="text-accent" /> Próximas Competições
                </h3>
                <div className="grid gap-4">
                    {eventosPublicos.length === 0 ? (
                        <p className="text-gray-400 text-sm italic p-4">Nenhuma competição aberta no momento.</p>
                    ) : (
                        eventosPublicos.map(ev => (
                            <div key={ev.id} className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-accent/20 transition-all gap-4">
                                <div className="flex-1">
                                    <p className="font-bold text-secondary text-lg">{ev.titulo}</p>
                                    <p className="text-[10px] font-black uppercase text-gray-400">
                                        {new Date(ev.data_evento).toLocaleDateString('pt-BR')} • {ev.valor_inscricao > 0 ? `R$ ${ev.valor_inscricao.toFixed(2)}` : 'Gratuito'}
                                    </p>
                                    
                                    {/* Seletor de Categoria */}
                                    {ev.categorias && ev.categorias.length > 0 && (
                                        <div className="mt-3">
                                            <select 
                                                className="w-full md:w-auto bg-white border border-gray-200 rounded-lg text-xs font-bold p-2 text-gray-600 outline-none focus:border-accent"
                                                value={categoriaSelecionada[ev.id] || ""}
                                                onChange={(e) => setCategoriaSelecionada({...categoriaSelecionada, [ev.id]: e.target.value})}
                                            >
                                                <option value="">Escolha sua categoria...</option>
                                                {ev.categorias.map((cat: any) => (
                                                    <option key={cat.id} value={cat.id}>{cat.nome} ({cat.genero})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    onClick={() => handleInscricao(ev)}
                                    disabled={inscritoLoading === ev.id}
                                    className="bg-secondary text-white px-8 py-3 rounded-xl text-xs font-black uppercase italic hover:bg-primary transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
                                >
                                    {inscritoLoading === ev.id ? "A Processar..." : "Confirmar Inscrição"}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Componente Interno de Card
function CardAtributo({ titulo, sub, valor, icon, href, cor }: any) {
    return (
        <Link href={href} className={`bg-white rounded-3xl p-6 shadow-xl border-l-8 ${cor} hover:scale-[1.03] transition-all cursor-pointer group`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{sub}</p>
            <h3 className="text-2xl font-black text-secondary mt-1 uppercase italic">{titulo}</h3>
            <p className="text-4xl font-black text-secondary mt-2">{valor}</p>
        </Link>
    );
}

export default ProtectedRoute(AlunoDashboard);