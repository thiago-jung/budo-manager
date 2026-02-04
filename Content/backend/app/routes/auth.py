from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.config.database import get_db
from app.models.models import Usuario, Dojo
from app.models.schemas import UsuarioCreate, LoginRequest, TokenResponse, UsuarioResponse
from app.services.auth_service import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register(dados: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dojo).where(Dojo.id == dados.dojo_id))
    dojo = result.scalar_one_or_none()
    if not dojo:
        raise HTTPException(status_code=404, detail="Dojo não encontrado.")

    result = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já está em uso.")

    usuario = Usuario(
        dojo_id=dados.dojo_id,
        email=dados.email,
        senha_hash=get_password_hash(dados.senha),
        nome=dados.nome,
        role=dados.role,
    )
    db.add(usuario)
    await db.commit()
    return usuario


@router.post("/login", response_model=TokenResponse)
async def login(dados: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Usuario).where(Usuario.email == dados.email))
    usuario = result.scalar_one_or_none()

    if not usuario or not verify_password(dados.senha, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos.",
        )

    if not usuario.ativo:
        raise HTTPException(status_code=403, detail="Usuário inativo.")

    token = create_access_token(data={"sub": str(usuario.id), "dojo_id": str(usuario.dojo_id)})

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario,
    }
