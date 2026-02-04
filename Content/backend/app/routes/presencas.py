from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import List

from app.config.database import get_db
from app.models.models import Presenca, Aluno, Usuario
from app.models.schemas import PresencaCreate, PresencaResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/presencas", tags=["Presenças"])


# ─────────────────────────────────────────────
# POST /presencas — Registra presença
# ─────────────────────────────────────────────
@router.post("/", response_model=PresencaResponse, status_code=status.HTTP_201_CREATED)
async def registrar_presenca(
    dados: PresencaCreate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verifica se o aluno existe e pertence ao dojo
    result = await db.execute(
        select(Aluno).where(Aluno.id == dados.aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    # Verifica duplicata na mesma data
    data_dia = dados.data.date()
    result = await db.execute(
        select(Presenca).where(
            Presenca.aluno_id == dados.aluno_id,
            func.date(Presenca.data) == data_dia,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Presença já registrada para esta data.")

    presenca = Presenca(
        aluno_id=dados.aluno_id,
        data=dados.data,
        presente=dados.presente,
    )
    db.add(presenca)
    await db.commit()

    return presenca


# ─────────────────────────────────────────────
# POST /presencas/qrcode/{aluno_id} — Check-in via QR Code
#   O QR Code gera um link com esse endpoint.
#   Registra presença automática com a data/hora atual.
# ─────────────────────────────────────────────
@router.post("/qrcode/{aluno_id}", response_model=PresencaResponse, status_code=status.HTTP_201_CREATED)
async def checkin_qrcode(
    aluno_id: str,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verifica aluno
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    agora = datetime.utcnow()

    # Verifica duplicata hoje
    result = await db.execute(
        select(Presenca).where(
            Presenca.aluno_id == aluno_id,
            func.date(Presenca.data) == agora.date(),
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Presença já registrada hoje.")

    presenca = Presenca(aluno_id=aluno_id, data=agora, presente=True)
    db.add(presenca)
    await db.commit()

    return presenca


# ─────────────────────────────────────────────
# GET /presencas/aluno/{aluno_id} — Histórico de presença
# ─────────────────────────────────────────────
@router.get("/aluno/{aluno_id}", response_model=List[PresencaResponse])
async def historico_presenca(
    aluno_id: str,
    dias: int = 30,  # Últimos 30 dias por padrão
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verifica aluno
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    data_limite = datetime.utcnow() - timedelta(days=dias)

    result = await db.execute(
        select(Presenca)
        .where(Presenca.aluno_id == aluno_id, Presenca.data >= data_limite)
        .order_by(Presenca.data.desc())
    )
    return result.scalars().all()


# ─────────────────────────────────────────────
# GET /presencas/resumo/{aluno_id} — Resumo estatístico
# ─────────────────────────────────────────────
@router.get("/resumo/{aluno_id}")
async def resumo_presenca(
    aluno_id: str,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retorna total de presenças no último mês e % de frequência."""
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    data_limite = datetime.utcnow() - timedelta(days=30)

    # Total de presenças registradas
    result = await db.execute(
        select(func.count(Presenca.id)).where(
            Presenca.aluno_id == aluno_id,
            Presenca.data >= data_limite,
            Presenca.presente == True,
        )
    )
    total_presencas = result.scalar()

    # Aulas esperadas (aproximação: ~4 aulas por semana)
    aulas_esperadas = 16

    porcentagem = min((total_presencas / aulas_esperadas) * 100, 100) if aulas_esperadas > 0 else 0

    return {
        "aluno_id": aluno_id,
        "total_presencas_30dias": total_presencas,
        "aulas_esperadas": aulas_esperadas,
        "porcentagem_frequencia": round(porcentagem, 1),
    }