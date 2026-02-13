"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/services/api";
import { Calendar, MapPin, Trophy, ShieldCheck, Zap } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function EventoPublicoPage() {
    const { id } = useParams();
    const [evento, setEvento] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        nome: "",
        email: "",
        telefone: "",
        categoria_id: ""
    });

    useEffect(() => {
        fetchEvento();
    }, [id]);

    const fetchEvento = async () => {
        try {
            // Rota pública para detalhes do evento (precisamos garantir que o backend permita)
            const res = await api.get(`/eventos/feed`);
            const ev = res.data.find((e: any) => e.id === id);
            if (!ev) throw new Error("Evento não encontrado");
            setEvento(ev);
        } catch (error) {
            toast.error("Evento não encontrado ou privado.");
        } finally {
            setLoading(false);
        }
    };

    const handleInscricao = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/eventos/${id}/inscrever-externo`, formData);
            toast.success("Inscrição realizada! Verifique seu WhatsApp.");
            setFormData({ nome: "", email: "", telefone: "", categoria_id: "" });
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Erro ao realizar inscrição.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase italic text-secondary">Carregando Arena...</div>;
    if (!evento) return <div className="min-h-screen flex items-center justify-center font-black uppercase italic text-red-500">Evento não encontrado.</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-secondary font-sans selection:bg-accent selection:text-white">
            <Toaster position="top-center" />
            
            {/* Hero Section */}
            <div className="bg-secondary text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/10 skew-x-12 translate-x-1/2"></div>
                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="bg-accent text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic mb-4 inline-block">
                        Competição Aberta
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic leading-none mb-6">
                        {evento.titulo}
                    </h1>
                    <div className="flex flex-wrap gap-6 text-sm font-bold opacity-80">
                        <div className="flex items-center gap-2"><Calendar size={18} className="text-accent" /> {new Date(evento.data_evento).toLocaleDateString('pt-BR')}</div>
                        <div className="flex items-center gap-2"><MapPin size={18} className="text-accent" /> {evento.dojo_nome || "Dojo Organizador"}</div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Detalhes */}
                <div className="lg:col-span-2 space-y-12">
                    <section>
                        <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
                            <ShieldCheck className="text-accent" /> Sobre o Evento
                        </h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                            {evento.descricao || "Participe desta grande celebração das artes marciais. Teste suas habilidades, ganhe experiência e conecte-se com a comunidade."}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
                            <Trophy className="text-accent" /> Categorias Disponíveis
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {evento.categorias.map((cat: any) => (
                                <div key={cat.id} className="bg-white p-6 rounded-[2rem] shadow-xl border-2 border-transparent hover:border-accent transition-all">
                                    <p className="font-black text-xl uppercase italic mb-1">{cat.nome}</p>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{cat.genero}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Formulário de Inscrição */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[3rem] shadow-2xl sticky top-8 border-t-[12px] border-accent">
                        <h3 className="text-2xl font-black uppercase italic mb-2">Inscrição</h3>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Garanta sua vaga na arena</p>
                        
                        <form onSubmit={handleInscricao} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Nome Completo</label>
                                <input 
                                    type="text" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-accent transition-all"
                                    value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Seu melhor E-mail</label>
                                <input 
                                    type="email" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-accent transition-all"
                                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">WhatsApp (com DDD)</label>
                                <input 
                                    type="tel" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-accent transition-all"
                                    value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Categoria</label>
                                <select 
                                    required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                                    value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {evento.categorias.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-6">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-gray-400 font-bold uppercase text-xs">Investimento</span>
                                    <span className="text-3xl font-black text-secondary italic">R$ {evento.valor_inscricao.toFixed(2)}</span>
                                </div>
                                <button 
                                    disabled={submitting}
                                    className="w-full bg-secondary text-white py-5 rounded-2xl font-black uppercase italic hover:bg-primary transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? "Processando..." : (
                                        <>Quero Competir <Zap size={18} className="text-accent" /></>
                                    )}
                                </button>
                                <p className="text-[9px] text-gray-400 text-center mt-4 font-bold uppercase">
                                    Pagamento via Pix/Boleto processado pelo Asaas
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}