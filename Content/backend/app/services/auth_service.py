import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import settings
from app.config.database import get_db
from app.models.models import Usuario

# Configuração
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# ─────────────────────────────────────────────
# Funções utilitárias (Usando bcrypt diretamente)
# ─────────────────────────────────────────────
def verify_password(senha_plana: str, senha_hash: str) -> bool:
    try:
        # O bcrypt verifica a senha plana contra o hash armazenado
        return bcrypt.checkpw(
            senha_plana.encode('utf-8'),
            senha_hash.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(senha: str) -> str:
    # Gera um salt e o hash da senha
    salt = bcrypt.gensalt()
    hash_bytes = bcrypt.hashpw(senha.encode('utf-8'), salt)
    return hash_bytes.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# ─────────────────────────────────────────────
# Dependency: extrai o usuário do token
# ─────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    usuario = result.scalar_one_or_none()

    if usuario is None or not usuario.ativo:
        raise credentials_exception

    return usuario