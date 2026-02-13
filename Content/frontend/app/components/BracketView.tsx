"use client";
import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

interface Atleta {
    id: string;
    nome: string;
}

interface Luta {
    atleta_a: Atleta;
    atleta_b: Atleta;
    vencedor: Atleta | null;
    status: string;
}

interface BracketProps {
    chaves: any; // O objeto JSON das chaves da categoria
}

export default function BracketView({ chaves }: BracketProps) {
    if (!chaves || !chaves.rodada_1) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-medium italic">As chaves ainda não foram geradas para esta categoria.</p>
            </div>
        );
    }

    const rodada1 = chaves.rodada_1;

    return (
        <div className="flex items-start gap-12 p-8 overflow-x-auto bg-gray-50/50 rounded-3xl border border-gray-100">
            {/* Rodada 1 */}
            <div className="flex flex-col gap-8 min-w-[220px]">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                    <h4 className="font-black text-secondary uppercase tracking-tighter text-[11px] italic">Oitavas / Quartas</h4>
                </div>
                
                {rodada1.map((luta: Luta, idx: number) => (
                    <div key={idx} className="relative group">
                        <div className={`w-56 bg-white shadow-sm rounded-xl overflow-hidden border-2 transition-all hover:shadow-md ${luta.status === 'finalizado' ? 'border-gray-100' : 'border-secondary/20'}`}>
                            {/* Atleta A */}
                            <div className={`p-3 flex justify-between items-center ${luta.vencedor?.id === luta.atleta_a.id ? 'bg-green-50' : ''}`}>
                                <span className={`text-xs font-bold truncate ${luta.vencedor?.id === luta.atleta_a.id ? 'text-green-700' : 'text-gray-700'}`}>
                                    {luta.atleta_a.nome}
                                </span>
                                {luta.vencedor?.id === luta.atleta_a.id && <Trophy size={12} className="text-green-500" />}
                            </div>
                            
                            <div className="h-[1px] bg-gray-50"></div>
                            
                            {/* Atleta B */}
                            <div className={`p-3 flex justify-between items-center ${luta.vencedor?.id === luta.atleta_b.id ? 'bg-green-50' : ''}`}>
                                <span className={`text-xs font-bold truncate ${luta.vencedor?.id === luta.atleta_b.id ? 'text-green-700' : 'text-gray-700'}`}>
                                    {luta.atleta_b.nome}
                                </span>
                                {luta.vencedor?.id === luta.atleta_b.id && <Trophy size={12} className="text-green-500" />}
                            </div>
                        </div>

                        {/* Conector Visual */}
                        <div className="absolute -right-12 top-1/2 w-12 h-[2px] bg-gray-200 group-hover:bg-secondary/30 transition-colors"></div>
                    </div>
                ))}
            </div>

            {/* Próxima Fase Placeholder */}
            <div className="flex flex-col justify-center h-full self-center">
                <div className="flex flex-col items-center gap-4 text-gray-300">
                    <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-2 bg-white/50">
                        <ChevronRight size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">
                            Aguardando <br/> Vencedores
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}