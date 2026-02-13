from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
import re

class GraduarRequest(BaseModel):
    nova_gradu_id: UUID

class GraduacaoCreate(BaseModel):
    nome: str
    ordem: int
    cor_hex: Optional[str] = "#FFFFFF"
    aulas_necessarias: int

class GraduacaoResponse(BaseModel):
    id: UUID
    nome: str
    ordem: int
    cor_hex: Optional[str]
    aulas_necessarias: int
    model_config = {"from_attributes": True}

class CategoriaCreate(BaseModel):
    nome: str
    genero: Optional[str] = "Misto"
    peso_min: Optional[float] = None
    peso_max: Optional[float] = None
    idade_min: Optional[int] = None
    idade_max: Optional[int] = None
    faixa_permitida: Optional[str] = None

class CategoriaResponse(BaseModel):
    id: UUID
    nome: str
    genero: Optional[str]
    model_config = {"from_attributes": True}

class EventoCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    data_evento: datetime
    tipo: str = "interno"
    visivel_rede: bool = False
    valor_inscricao: float = 0.0
    categorias: List[CategoriaCreate] = []

class EventoResponse(BaseModel):
    id: UUID
    titulo: str
    tipo: str
    data_evento: datetime
    visivel_rede: bool
    promovido: bool
    status: str
    categorias: List[CategoriaResponse] = []
    model_config = {"from_attributes": True}

class InscricaoRequest(BaseModel):
    categoria_id: UUID

class GerarChaveRequest(BaseModel):
    categoria_id: UUID
    metodo: str = "simples" # simples (mata-mata) ou pontos

class PresencaItem(BaseModel):
    aluno_id: UUID
    presente: bool

class PresencaBulk(BaseModel):
    data: datetime
    lista_presenca: List[PresencaItem]

class AsaasWebhook(BaseModel):
    event: str
    payment: Dict[str, Any]


class AtivacaoConta(BaseModel):
    aluno_id: UUID
    senha: str
    confirmacao_senha: str

    @field_validator('confirmacao_senha')
    def senhas_iguais(cls, v, info):
        if 'senha' in info.data and v != info.data['senha']:
            # Removi o acento para evitar o erro de codec no seu ambiente
            raise ValueError('As senhas nao coincidem')
        return v



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
    data_inicio: Optional[datetime] = None

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
    data_nascimento: Optional[datetime]
    data_inicio: datetime
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
