from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re

class OnboardingCreate(BaseModel):
    # Dados do Professor
    admin_nome: str
    admin_email: EmailStr
    admin_senha: str

    # Dados do Dojo
    dojo_nome: str
    dojo_telefone: Optional[str] = None
    dojo_endereco: Optional[str] = None

    # Validador de segurança para o telefone (Blindagem)
    @field_validator('dojo_telefone', mode='before')
    @classmethod
    def limpar_telefone(cls, v):
        if v:
            return re.sub(r'\D', '', v)
        return v

class DojoCreate(BaseModel):
    nome: str
    endereco: Optional[str] = None
    telefone: Optional[str] = None

class DojoResponse(BaseModel):
    id: UUID
    nome: str
    endereco: Optional[str]
    telefone: Optional[str]
    criado_em: datetime
    model_config = {"from_attributes": True}


class UsuarioCreate(BaseModel):
    email: EmailStr
    senha: str
    nome: str
    dojo_id: UUID
    role: str = "professor"

class UsuarioResponse(BaseModel):
    id: UUID
    email: str
    nome: str
    role: str
    dojo_id: UUID
    model_config = {"from_attributes": True}

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


class AlunoCreate(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_nascimento: Optional[datetime] = None

    # Validador que limpa CPF e Telefone antes de chegar na rota
    @field_validator('cpf', 'telefone', mode='before')
    @classmethod
    def limpar_formatacao(cls, v):
        if isinstance(v, str):
            # Remove tudo que não é número (\D)
            return re.sub(r'\D', '', v)
        return v

class AlunoUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    faixa_atual: Optional[str] = None
    ativo: Optional[bool] = None

class AlunoResponse(BaseModel):
    id: UUID
    dojo_id: UUID
    nome: str
    cpf: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    faixa_atual: str
    ativo: bool
    data_inicio: datetime
    criado_em: datetime
    model_config = {"from_attributes": True}


class PagamentoCreate(BaseModel):
    aluno_id: UUID
    valor: float
    metodo: Optional[str] = None
    referencia_mes: Optional[str] = None

class PagamentoResponse(BaseModel):
    id: UUID
    aluno_id: UUID
    valor: float
    status: str
    metodo: Optional[str]
    referencia_mes: Optional[str]
    criado_em: datetime
    model_config = {"from_attributes": True}


class PresencaCreate(BaseModel):
    aluno_id: UUID
    data: datetime
    presente: bool = True

class PresencaResponse(BaseModel):
    id: UUID
    aluno_id: UUID
    data: datetime
    presente: bool
    model_config = {"from_attributes": True}
