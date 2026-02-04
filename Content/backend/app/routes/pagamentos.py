from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.config.database import get_db
from app.models.models import Pagamento, Aluno, Usuario
from app.models.schemas import PagamentoCreate, PagamentoResponse
from app.services.auth_service import get_current_user
from app.services.asaas_service import asaas_service
from app.services.evolution_service import evolution_service

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])


# ─────────────────────────────────────────────
# POST /pagamentos — Cria cobrança (Asaas + BD)
# ─────────────────────────────────────────────
@router.post("/", response_model=PagamentoResponse, status_code=status.HTTP_201_CREATED)
async def criar_pagamento(
    dados: PagamentoCreate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Busca o aluno
    result = await db.execute(
        select(Aluno).where(Aluno.id == dados.aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    # Cria cliente no Asaas (se tiver CPF)
    asaas_customer_id = None
    if aluno.cpf:
        cliente_existente = await asaas_service.buscar_cliente_por_cpf(aluno.cpf)
        if cliente_existente:
            asaas_customer_id = cliente_existente["id"]
        else:
            novo_cliente = await asaas_service.criar_cliente(aluno.nome, aluno.cpf)
            asaas_customer_id = novo_cliente.get("id")

    # Cria cobrança no Asaas
    asaas_payment_id = None
    if asaas_customer_id and dados.referencia_mes:
        # Usa último dia do mês como vencimento
        vencimento = f"{dados.referencia_mes}-28"
        pagamento_asaas = await asaas_service.criar_pagamento(
            customer_id=asaas_customer_id,
            valor=dados.valor,
            vencimento=vencimento,
        )
        asaas_payment_id = pagamento_asaas.get("id")

    # Salva no banco local
    pagamento = Pagamento(
        aluno_id=dados.aluno_id,
        valor=dados.valor,
        metodo=dados.metodo,
        referencia_mes=dados.referencia_mes,
        asaas_id=asaas_payment_id,
        status="pendente",
    )
    db.add(pagamento)
    await db.commit()

    # Envia notificação WhatsApp de cobrança pendente
    if aluno.telefone:
        mensagem = evolution_service.template_cobranca_pendente(
            nome_aluno=aluno.nome,
            valor=dados.valor,
            vencimento=dados.referencia_mes or "em breve",
        )
        try:
            await evolution_service.enviar_mensagem(aluno.telefone, mensagem)
        except Exception:
            pass  # Não bloqueia a criação se o WhatsApp falhar

    return pagamento


# ─────────────────────────────────────────────
# GET /pagamentos — Lista pagamentos do dojo
# ─────────────────────────────────────────────
@router.get("/", response_model=List[PagamentoResponse])
async def listar_pagamentos(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Pagamento)
        .join(Aluno, Pagamento.aluno_id == Aluno.id)
        .where(Aluno.dojo_id == usuario.dojo_id)
        .order_by(Pagamento.criado_em.desc())
    )
    return result.scalars().all()


# ─────────────────────────────────────────────
# POST /pagamentos/webhook — Webhook do Asaas
#   Chamado automaticamente pelo Asaas quando
#   um pagamento muda de status.
# ─────────────────────────────────────────────
@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook_asaas(payload: dict, db: AsyncSession = Depends(get_db)):
    """
    Recebe notificações do Asaas sobre mudanças de pagamento.
    Atualiza o status no banco e envia WhatsApp se necessário.
    """
    evento = payload.get("event")
    pagamento_data = payload.get("payment", {})
    asaas_id = pagamento_data.get("id")

    if not asaas_id:
        return {"status": "ignorado"}

    # Busca o pagamento local pelo ID do Asaas
    result = await db.execute(
        select(Pagamento).where(Pagamento.asaas_id == asaas_id)
    )
    pagamento = result.scalar_one_or_none()

    if not pagamento:
        return {"status": "pagamento não encontrado"}

    # Mapeia eventos do Asaas para nossos status
    mapa_status = {
        "PAYMENT_RECEIVED": "pago",
        "PAYMENT_CONFIRMED": "pago",
        "PAYMENT_OVERDUE":   "atraso",
        "PAYMENT_DELETED":   "cancelado",
    }

    novo_status = mapa_status.get(evento)
    if novo_status:
        pagamento.status = novo_status

        # Busca o aluno para enviar WhatsApp
        result = await db.execute(select(Aluno).where(Aluno.id == pagamento.aluno_id))
        aluno = result.scalar_one_or_none()

        if aluno and aluno.telefone:
            if novo_status == "pago":
                mensagem = evolution_service.template_pagamento_confirmado(aluno.nome, pagamento.valor)
            elif novo_status == "atraso":
                mensagem = evolution_service.template_cobranca_atraso(aluno.nome, pagamento.valor, dias_atraso=1)
            else:
                mensagem = None

            if mensagem:
                try:
                    await evolution_service.enviar_mensagem(aluno.telefone, mensagem)
                except Exception:
                    pass

        await db.commit()

    return {"status": "processado", "evento": evento}