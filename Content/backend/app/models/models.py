import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base


class Dojo(Base):
    __tablename__ = "dojos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(150), nullable=False)
    endereco = Column(Text, nullable=True)
    telefone = Column(String(20), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    usuarios = relationship("Usuario", back_populates="dojo")
    alunos = relationship("Aluno", back_populates="dojo")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    nome = Column(String(150), nullable=False)
    role = Column(String(30), default="professor")
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    aluno_id = Column(UUID(as_uuid=True), ForeignKey("alunos.id"), nullable=True) # Se for aluno, aponta para o registro dele

    dojo = relationship("Dojo", back_populates="usuarios")


class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(11), unique=True, nullable=True)
    telefone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    data_nascimento = Column(DateTime, nullable=True)
    faixa_atual = Column(String(30), default="Branca")
    data_inicio = Column(DateTime, default=datetime.utcnow)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    graduacao_id = Column(UUID(as_uuid=True), ForeignKey("graduacoes.id"), nullable=True)

    graduacao = relationship("Graduacao")
    dojo = relationship("Dojo", back_populates="alunos")
    pagamentos = relationship("Pagamento", back_populates="aluno")
    presencas = relationship("Presenca", back_populates="aluno")


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aluno_id = Column(UUID(as_uuid=True), ForeignKey("alunos.id"), nullable=False)
    valor = Column(Float, nullable=False)
    status = Column(String(20), default="pendente")
    metodo = Column(String(20), nullable=True)
    asaas_id = Column(String(100), nullable=True)
    referencia_mes = Column(String(7), nullable=True)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    aluno = relationship("Aluno", back_populates="pagamentos")


class Presenca(Base):
    __tablename__ = "presencas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aluno_id = Column(UUID(as_uuid=True), ForeignKey("alunos.id"), nullable=False)
    data = Column(DateTime, nullable=False)
    presente = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    aluno = relationship("Aluno", back_populates="presencas")

class Graduacao(Base):
    __tablename__ = "graduacoes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)
    nome = Column(String(50), nullable=False) # Ex: "Faixa Azul", "Corda Verde"
    ordem = Column(Integer, default=0) # Para ordenar a progressão
    cor_hex = Column(String(7), nullable=True) # Para a UI brilhar com a cor da faixa

    dojo = relationship("Dojo")