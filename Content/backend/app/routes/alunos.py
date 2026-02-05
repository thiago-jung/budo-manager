from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.config.database import get_db
from app.models.models import Aluno, Usuario
from app.models.schemas import AlunoCreate, AlunoUpdate, AlunoResponse
from app.services.auth_service import get_current_user
from app.services.asaas_service import AsaasService

router = APIRouter(prefix="/alunos", tags=["Alunos"])


@router.post("/", response_model=AlunoResponse, status_code=status.HTTP_201_CREATED)
async def criar_aluno(
    dados: AlunoCreate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if dados.cpf:
        result = await db.execute(select(Aluno).where(Aluno.cpf == dados.cpf))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="CPF já está cadastrado.")

    cpf_limpo = dados.cpf.replace(".", "").replace("-", "")

    aluno = Aluno(
        dojo_id=usuario.dojo_id,
        nome=dados.nome,
        cpf=cpf_limpo,
        telefone=dados.telefone,
        email=dados.email,
        data_nascimento=dados.data_nascimento,
        asaas_id=asaas_id
    )
    db.add(aluno)
    await db.commit()
    return aluno


@router.get("/", response_model=List[AlunoResponse])
async def listar_alunos(
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Aluno)
        .where(Aluno.dojo_id == usuario.dojo_id)
        .order_by(Aluno.nome)
    )
    return result.scalars().all()


@router.get("/{aluno_id}", response_model=AlunoResponse)
async def buscar_aluno(
    aluno_id: UUID,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")
    return aluno


@router.put("/{aluno_id}", response_model=AlunoResponse)
async def atualizar_aluno(
    aluno_id: UUID,
    dados: AlunoUpdate,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(aluno, campo, valor)

    await db.commit()
    return aluno


@router.delete("/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desativar_aluno(
    aluno_id: UUID,
    usuario: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Aluno).where(Aluno.id == aluno_id, Aluno.dojo_id == usuario.dojo_id)
    )
    aluno = result.scalar_one_or_none()
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado.")

    aluno.ativo = False
    await db.commit()
