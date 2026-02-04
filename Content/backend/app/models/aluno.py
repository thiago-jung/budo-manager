import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base

class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)

    nome = Column(String(150), nullable=False)
    cpf = Column(String(11), unique=True, nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    data_nascimento = Column(DateTime, nullable=True)
    faixa_atual = Column(String(30), default="Branca")
    data_inicio = Column(DateTime, default=datetime.utcnow)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    dojo = relationship("Dojo", back_populates="alunos")
    pagamentos = relationship("Pagamento", back_populates="aluno")
    presencas = relationship("Presenca", back_populates="aluno")