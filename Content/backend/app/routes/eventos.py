from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import random
import json

from typing import List

from uuid import UUID

from app.config.database import get_db
from app.models.models import Evento, InscricaoEvento, Usuario, Aluno
from app.models.schemas import EventoCreate, EventoResponse, GerarChaveRequest
from app.services.auth_service import get_current_user
from app.services.asaas_service import asaas_service
from app.services.evolution_service import evolution_service

router = APIRouter(prefix="/eventos", tags=["Eventos"])

@router.post("/{evento_id}/inscrever")
async def inscrever_aluno_evento(
    evento_id: UUID,
    dados: InscricaoRequest,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Verificar se é aluno e tem vínculo
    if usuario.role != "aluno" or not usuario.aluno_id:
        raise HTTPException(status_code=403, detail="Apenas alunos podem se inscrever.")

    # 2. Verificar se o evento existe
    result_ev = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result_ev.scalar_one_or_none()
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado.")

    # 3. Verificar se a categoria existe
    result_cat = await db.execute(
        select(CategoriaEvento).where(
            CategoriaEvento.id == dados.categoria_id,
            CategoriaEvento.evento_id == evento_id
        )
    )
    if not result_cat.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Categoria não encontrada para este evento.")

    # 4. Verificar se já está inscrito no evento
    result_ins = await db.execute(
        select(InscricaoEvento).where(
            InscricaoEvento.evento_id == evento_id,
            InscricaoEvento.aluno_id == usuario.aluno_id
        )
    )
    if result_ins.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Você já está inscrito neste evento.")

    # 5. Criar inscrição
    nova_inscricao = InscricaoEvento(
        evento_id=evento_id,
        aluno_id=usuario.aluno_id,
        categoria_id=dados.categoria_id,
        pago=(evento.valor_inscricao <= 0) # Grátis já nasce pago
    )

    # 6. Se for pago, gerar cobrança no Asaas
    if evento.valor_inscricao > 0:
        result_al = await db.execute(select(Aluno).where(Aluno.id == usuario.aluno_id))
        aluno = result_al.scalar_one()

        if aluno.asaas_id:
            cobranca = await asaas_service.criar_pagamento(
                customer_id=aluno.asaas_id,
                valor=evento.valor_inscricao,
                vencimento=evento.data_evento.strftime("%Y-%m-%d")
            )
            nova_inscricao.asaas_payment_id = cobranca.get("id")

            msg = f"Olá {aluno.nome}! Sua inscrição no evento {evento.titulo} foi recebida. Link para pagamento: {cobranca.get('invoiceUrl')}"
            await evolution_service.enviar_mensagem(aluno.telefone, msg)

    db.add(nova_inscricao)
    await db.commit()
    return {"message": "Inscrição realizada com sucesso!"}

@router.post("/", response_model=EventoResponse)
async def criar_evento(
    dados: EventoCreate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    dados_dict = dados.model_dump()
    categorias_data = dados_dict.pop("categorias", [])
    
    novo_evento = Evento(**dados_dict, dojo_id=usuario.dojo_id)
    db.add(novo_evento)
    await db.flush() # Para pegar o ID do evento

    for cat in categorias_data:
        nova_cat = CategoriaEvento(**cat, evento_id=novo_evento.id)
        db.add(nova_cat)

    await db.commit()
    await db.refresh(novo_evento)
    return novo_evento

@router.get("/meus", response_model=List[EventoResponse])
async def listar_meus_eventos(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Evento)
        .options(selectinload(Evento.categorias))
        .where(Evento.dojo_id == usuario.dojo_id)
        .order_by(Evento.data_evento.desc())
    )
    return result.scalars().all()

@router.get("/feed")
async def feed_eventos_publicos(db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Evento)
        .options(selectinload(Evento.categorias))
        .where(Evento.visivel_rede == True)
        .order_by(Evento.promovido.desc(), Evento.data_evento.asc())
    )
    return result.scalars().all()

@router.post("/{evento_id}/gerar-chaves")
async def gerar_chaves_competicao(
    evento_id: UUID,
    config: GerarChaveRequest,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Busca inscritos confirmados na categoria específica
    result = await db.execute(
        select(InscricaoEvento)
        .where(
            InscricaoEvento.evento_id == evento_id,
            InscricaoEvento.categoria_id == config.categoria_id,
            InscricaoEvento.pago == True
        )
    )
    inscritos = result.scalars().all()

    if len(inscritos) < 2:
        raise HTTPException(status_code=400, detail="Mínimo de 2 inscritos pagos nesta categoria para gerar chaves.")

    # 2. Algoritmo de Chaveamento (Mata-mata)
    # Busca nomes para facilitar a visualização no JSON
    participantes = []
    for i in inscritos:
        res_al = await db.execute(select(Aluno.nome).where(Aluno.id == i.aluno_id))
        nome = res_al.scalar()
        participantes.append({"id": str(i.aluno_id), "nome": nome})
    
    random.shuffle(participantes)

    lutas = []
    for i in range(0, len(participantes), 2):
        if i + 1 < len(participantes):
            lutas.append({
                "atleta_a": participantes[i], 
                "atleta_b": participantes[i+1], 
                "vencedor": None,
                "status": "pendente"
            })
        else:
            # Bye (passa direto)
            lutas.append({
                "atleta_a": participantes[i], 
                "atleta_b": {"id": "BYE", "nome": "---"}, 
                "vencedor": participantes[i],
                "status": "finalizado"
            })

    # 3. Atualiza o JSON das chaves no evento
    result_evento = await db.execute(select(Evento).where(Evento.id == evento_id))
    evento = result_evento.scalar_one()
    
    chaves_atuais = json.loads(evento.chaves_json) if evento.chaves_json else {}
    chaves_atuais[str(config.categoria_id)] = {"rodada_1": lutas}
    
    evento.chaves_json = json.dumps(chaves_atuais)

    await db.commit()
    return {"message": "Chaves geradas para a categoria!", "estrutura": lutas}