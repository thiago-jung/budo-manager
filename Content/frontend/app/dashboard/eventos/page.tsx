"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/middleware/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/services/api";
import { Calendar, Trophy, Users, Plus, Zap, Globe, Lock, Eye } from "lucide-react";
import * as React from "react";
import BracketView from "@/components/BracketView";

function EventosPage() {
    const { user } = useAuth();
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [categoriaVisualizar, setCategoriaVisualizar] = useState<{eventoId: string, catId: string, chaves: any} | null>(null);

    // Estado do formulário
    const [novoEvento, setNovoEvento] = useState({
        titulo: "",
        descricao: "",
        data_evento: "",
        tipo: "interno",
        visivel_rede: false,
        valor_inscricao: 0,
        categorias: [] as any[]
    });

    const [novaCategoria, setNovaCategoria] = useState({ nome: "", genero: "Misto" });

    const addCategoria = () => {
        if (!novaCategoria.nome) return;
        setNovoEvento({
            ...novoEvento,
            categorias: [...novoEvento.categorias, novaCategoria]
        });
        setNovaCategoria({ nome: "", genero: "Misto" });
    };

    const removeCategoria = (index: number) => {
        const cats = [...novoEvento.categorias];
        cats.splice(index, 1);
        setNovoEvento({ ...novoEvento, categorias: cats });
    };

    useEffect(() => {
        fetchEventos();
    }, []);

    const fetchEventos = async () => {
        try {
            // Rota para buscar eventos do dojo logado
            const res = await api.get("/eventos/meus");
            setEventos(res.data);
        } catch (error) {
            console.error("Erro ao carregar eventos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/eventos/", novoEvento);
            setShowForm(false);
            fetchEventos();
            setNovoEvento({ titulo: "", descricao: "", data_evento: "", tipo: "interno", visivel_rede: false, valor_inscricao: 0, categorias: [] });
        } catch (error) {
            alert("Erro ao criar evento");
        }
    };

    const gerarChaves = async (eventoId: string, categoriaId: string) => {
        if (!confirm("Deseja gerar as chaves para esta categoria?")) return;
        try {
            await api.post(`/eventos/${eventoId}/gerar-chaves`, { categoria_id: categoriaId, metodo: "simples" });
            alert("Chaves geradas com sucesso!");
            fetchEventos();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Erro ao gerar chaves");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Eventos & Competições</h1>
                    <p className="text-gray-400 text-sm">Gerencie exames de faixa e campeonatos do dojo.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> Novo Evento
                </button>
            </div>

            {/* Formulário de Criação */}
            {showForm && (
                <div className="card mb-8 animate-in fade-in slide-in-from-top-4">
                    <h2 className="font-bold text-lg mb-4">Cadastrar Novo Evento</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                                Título do Evento
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                required
                                value={novoEvento.titulo}
                                onChange={e => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
                                placeholder="Ex: Open de Karatê ou Exame de Faixa 2026"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                                Data e Hora
                            </label>
                            <input
                                type="datetime-local"
                                className="input-field" // Classe corrigida
                                required
                                value={novoEvento.data_evento}
                                onChange={e => setNovoEvento({ ...novoEvento, data_evento: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Valor Inscrição (R$)
                            </label>
                            <input
                                type="number"
                                className="input-field" // Alterado de 'input' para 'input-field'
                                value={novoEvento.valor_inscricao}
                                onChange={e => setNovoEvento({ ...novoEvento, valor_inscricao: Number(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                Tipo de Evento
                            </label>
                            <select
                                className="input-field appearance-none cursor-pointer" // Adicionado input-field e ajuste de cursor
                                value={novoEvento.tipo}
                                onChange={e => setNovoEvento({ ...novoEvento, tipo: e.target.value })}
                            >
                                <option value="interno">Interno (Exame/Seminário)</option>
                                <option value="publico">Público (Campeonato/Open)</option>
                            </select>
                        </div>                        <div className="flex items-center gap-3 pt-8">
                            <input
                                type="checkbox" id="visivel" className="w-5 h-5 accent-primary"
                                checked={novoEvento.visivel_rede}
                                onChange={e => setNovoEvento({ ...novoEvento, visivel_rede: e.target.checked })}
                            />
                            <label htmlFor="visivel" className="text-sm font-medium text-gray-700">
                                Visível para outros dojos na rede?
                            </label>
                        </div>

                        {/* Gestão de Categorias */}
                        {novoEvento.tipo === 'publico' && (
                            <div className="md:col-span-2 border-t pt-4 mt-4">
                                <h3 className="font-bold text-gray-700 mb-2">Categorias de Competição</h3>
                                <div className="flex gap-2 mb-4">
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Absoluto Preta" 
                                        className="input-field flex-1"
                                        value={novaCategoria.nome}
                                        onChange={e => setNovaCategoria({...novaCategoria, nome: e.target.value})}
                                    />
                                    <select 
                                        className="input-field w-32"
                                        value={novaCategoria.genero}
                                        onChange={e => setNovaCategoria({...novaCategoria, genero: e.target.value})}
                                    >
                                        <option value="Misto">Misto</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                    </select>
                                    <button type="button" onClick={addCategoria} className="bg-secondary text-white px-4 rounded-lg">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {novoEvento.categorias.map((cat, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                            {cat.nome} ({cat.genero})
                                            <button type="button" onClick={() => removeCategoria(i)} className="text-red-500 font-bold">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-500">Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar Evento</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listagem de Eventos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <p className="text-gray-400">Carregando eventos...</p>
                ) : eventos.length === 0 ? (
                    <div className="card col-span-2 text-center py-12">
                        <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500">Nenhum evento cadastrado ainda.</p>
                    </div>
                ) : (
                    eventos.map((evento) => (
                        <div key={evento.id} className="card border-l-8 border-secondary hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-lg ${evento.tipo === 'publico' ? 'bg-accent/20 text-accent' : 'bg-blue-100 text-blue-600'}`}>
                                    {evento.tipo === 'publico' ? <Trophy size={20} /> : <Users size={20} />}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                                    {evento.visivel_rede ? (
                                        <span className="flex items-center gap-1 text-green-600"><Globe size={12} /> Público</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-gray-400"><Lock size={12} /> Privado</span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-secondary mb-1">{evento.titulo}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {new Date(evento.data_evento).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                            </p>

                            {/* Categorias do Evento */}
                            {evento.categorias && evento.categorias.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Categorias / Chaves</p>
                                    <div className="flex flex-wrap gap-2">
                                        {evento.categorias.map((cat: any) => (
                                            <div key={cat.id} className="flex items-center gap-2 bg-gray-50 border p-2 rounded-lg">
                                                <span className="text-xs font-bold text-gray-700">{cat.nome}</span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => gerarChaves(evento.id, cat.id)}
                                                        className="bg-secondary/10 text-secondary p-1 rounded hover:bg-secondary/20 transition-colors"
                                                        title="Gerar/Atualizar Chaves"
                                                    >
                                                        <Zap size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const chavesAll = evento.chaves_json ? JSON.parse(evento.chaves_json) : {};
                                                            setCategoriaVisualizar({
                                                                eventoId: evento.id,
                                                                catId: cat.id,
                                                                chaves: chavesAll[cat.id] || null
                                                            });
                                                        }}
                                                        className="bg-primary/10 text-primary p-1 rounded hover:bg-primary/20 transition-colors"
                                                        title="Visualizar Chaves"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Visualização da Chave Selecionada */}
                                    {categoriaVisualizar?.eventoId === evento.id && (
                                        <div className="mt-4 animate-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-[10px] font-bold text-secondary uppercase italic">Árvore de Competição</p>
                                                <button onClick={() => setCategoriaVisualizar(null)} className="text-[10px] text-gray-400 hover:text-red-500">Fechar</button>
                                            </div>
                                            <BracketView chaves={categoriaVisualizar.chaves} />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                                <span className="text-lg font-bold text-gray-700">
                                    {evento.valor_inscricao > 0 ? `R$ ${evento.valor_inscricao.toFixed(2)}` : 'Gratuito'}
                                </span>

                                <div className="flex gap-2">
                                    <button className="text-xs font-bold text-primary hover:underline">Ver Detalhes</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}

export default ProtectedRoute(EventosPage);