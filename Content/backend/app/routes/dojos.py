from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.config.database import get_db
from app.models.models import Dojo
from app.models.schemas import DojoCreate, DojoResponse

router = APIRouter(prefix="/dojos", tags=["Dojos"])

@router.post("/", response_model=DojoResponse, status_code=status.HTTP_201_CREATED)
async def criar_dojo(dados: DojoCreate, db: AsyncSession = Depends(get_db)):
    """Cria um novo Dojo no sistema."""
    dojo = Dojo(
        nome=dados.nome,
        endereco=dados.endereco,
        telefone=dados.telefone
    )
    db.add(dojo)
    await db.commit()
    return dojo

@router.get("/", response_model=List[DojoResponse])
async def listar_dojos(db: AsyncSession = Depends(get_db)):
    """Lista todos os dojos cadastrados."""
    result = await db.execute(select(Dojo))
    return result.scalars().all()