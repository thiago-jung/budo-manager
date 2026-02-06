"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import XPBar from "@/components/XPBar";
import * as React from "react";

export default function AlunoDashboard() {
    const { usuario } = useAuth(); // Certifique-se que o AuthContext provê o objeto usuario
    const [progresso, setProgresso] = useState<any>(null);
    const [pagamentos, setPagamentos] = useState<any[]>([]);
    const [pixData, setPixData] = useState<{ qrCode: string, copyPaste: string } | null>(null);
    const [loadingPix, setLoadingPix] = useState(false);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progRes, pagRes] = await Promise.all([
                    api.get("/alunos/meu-progresso"),
                    api.get("/pagamentos/meus")
                ]);
                setProgresso(progRes.data);
                setPagamentos(pagRes.data);
            } catch (err) {
                console.error("Erro ao carregar dados do aluno", err);
            }
        };
        fetchData();
    }, []);

    const handlePagarPix = async (pagamentoId: string) => {
        setLoadingPix(true);
        try {
            const res = await api.get(`/pagamentos/${pagamentoId}/pix`);
            setPixData({
                qrCode: res.data.encodedImage, // Imagem em Base64 vinda do Asaas
                copyPaste: res.data.payload     // Chave Copia e Cola vinda do Asaas
            });
        } catch (err) {
            alert("Erro ao gerar PIX. Tente novamente mais tarde.");
        } finally {
            setLoadingPix(false);
        }
    };

    const copyToClipboard = () => {
        if (pixData?.copyPaste) {
            navigator.clipboard.writeText(pixData.copyPaste);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        }
    };

    if (!progresso) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <p className="text-white font-bold animate-pulse">Carregando seus atributos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary p-4 md:p-8">
            {/* MODAL DE PIX */}
            {pixData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-800">Pagamento via PIX</h3>

                        <img
                            src={`data:image/png;base64,${pixData.qrCode}`}
                            alt="QR Code PIX"
                            className="w-64 h-64 mx-auto border-4 border-gray-100 rounded-xl"
                        />

                        <div className="space-y-2">
                            <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-300 relative group">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Código Copia e Cola</p>
                                <p className="text-[10px] break-all text-gray-600 font-mono line-clamp-2">
                                    {pixData.copyPaste}
                                </p>
                            </div>

                            <button
                                onClick={copyToClipboard}
                                className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${copiado
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-800 text-white hover:bg-black"
                                    }`}
                            >
                                {copiado ? "✓ COPIADO!" : "COPIAR CÓDIGO PIX"}
                            </button>
                        </div>

                        <button
                            onClick={() => { setPixData(null); setCopiado(false); }}
                            className="text-gray-400 text-xs font-bold hover:text-gray-600 uppercase tracking-widest pt-2"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-6">
                {/* HEADER: CHARACTER CARD */}
                <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6 border-b-8 border-accent">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-gray-200">
                        🥋
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-gray-800 uppercase italic">
                            {usuario?.nome || "Combatente"}
                        </h1>
                        <p className="text-accent font-bold tracking-widest">
                            FAIXA {progresso.faixa_nome?.toUpperCase() || "BRANCA"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COLUNA 1: PROGRESSO/XP */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl space-y-6">
                        <h2 className="text-lg font-black text-gray-700 uppercase italic flex items-center gap-2">
                            <span className="text-accent">◈</span> Atributos e XP
                        </h2>

                        <XPBar percentual={progresso.progresso_percentual} aulas={progresso.total_aulas} />

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                                <p className="text-sm font-bold text-green-600 uppercase">Em Combate</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Pronto Exame</p>
                                <p className={`text-sm font-bold ${progresso.pronto_para_exame ? "text-accent" : "text-gray-400"}`}>
                                    {progresso.pronto_para_exame ? "DISPONÍVEL" : "BLOQUEADO"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA 2: FINANCEIRO */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
                        <h2 className="text-lg font-black text-gray-700 uppercase italic flex items-center gap-2">
                            <span className="text-accent">◈</span> Mensalidades
                        </h2>

                        <div className="space-y-3">
                            {pagamentos.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Nenhuma cobrança pendente.</p>
                            ) : (
                                pagamentos.map((pag) => (
                                    <div key={pag.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-accent transition-colors">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">
                                                Venc: {new Date(pag.vencimento).toLocaleDateString('pt-BR')}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium">R$ {pag.valor.toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePagarPix(pag.id)}
                                            disabled={loadingPix}
                                            className="bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {loadingPix ? "..." : "PAGAR PIX"}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}