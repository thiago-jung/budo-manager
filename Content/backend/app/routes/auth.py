from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.config.database import get_db
from app.models.models import Usuario, Dojo, Graduacao
from app.models.schemas import UsuarioCreate, LoginRequest, TokenResponse, UsuarioResponse, OnboardingCreate
from app.services.auth_service import get_password_hash, verify_password, create_access_token

FAIXAS_PADRAO = [
    {"nome": "Branca", "ordem": 1, "cor": "#FFFFFF"},
    {"nome": "Amarela", "ordem": 2, "cor": "#FFFF00"},
    {"nome": "Vermelha", "ordem": 3, "cor": "#FF0000"},
    {"nome": "Laranja", "ordem": 4, "cor": "#FFA500"},
    {"nome": "Verde", "ordem": 5, "cor": "#008000"},
    {"nome": "Roxa", "ordem": 6, "cor": "#800080"},
    {"nome": "Marrom", "ordem": 7, "cor": "#8B4513"},
    {"nome": "Preta", "ordem": 8, "cor": "#000000"},
]

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/onboard", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def onboard_professor(dados: OnboardingCreate, db: AsyncSession = Depends(get_db)):
    # 1. Validação de segurança: email único
    result = await db.execute(select(Usuario).where(Usuario.email == dados.admin_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    try:
        # 2. Cria o Dojo
        novo_dojo = Dojo(
            nome=dados.dojo_nome,
            telefone=dados.dojo_telefone,
            endereco=dados.dojo_endereco
        )
        db.add(novo_dojo)
        await db.flush() # Gera o ID do Dojo para as próximas etapas

        # 3. Cria o Usuário Administrador (Professor)
        novo_usuario = Usuario(
            dojo_id=novo_dojo.id,
            email=dados.admin_email,
            senha_hash=get_password_hash(dados.admin_senha),
            nome=dados.admin_nome,
            role="professor"
        )
        db.add(novo_usuario)

        # 4. Popula com as Graduações Padrão (Passo 2 solicitado)
        for faixa in FAIXAS_PADRAO:
            nova_grad = Graduacao(
                dojo_id=novo_dojo.id,
                nome=faixa["nome"],
                ordem=faixa["ordem"],
                cor_hex=faixa["cor"]
            )
            db.add(nova_grad)

        await db.commit() # Salva tudo de forma atômica (SaaS safe)

        # 5. Retorna o token para o professor entrar logado
        token = create_access_token(data={"sub": str(novo_usuario.id), "dojo_id": str(novo_dojo.id)})
        return {
            "access_token": token,
            "token_type": "bearer",
            "usuario": novo_usuario
        }
    except Exception as e:
        await db.rollback()
        print(f"Erro no Onboarding: {e}")
        raise HTTPException(status_code=500, detail="Erro ao criar conta do dojo.")


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
