import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base


class Pagamento(Base):
    __tablename__ = "pagamentos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    aluno_id = Column(UUID(as_uuid=True), ForeignKey("alunos.id"), nullable=False)

    valor = Column(Float, nullable=False)
    status = Column(String(20), default="pendente")  # pendente | pago | atraso | cancelado
    metodo = Column(String(20), nullable=True)       # pix | boleto | cartao
    asaas_id = Column(String(100), nullable=True)    # ID do pagamento no Asaas
    referencia_mes = Column(String(7), nullable=True) # ex: "2025-01"
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    aluno = relationship("Aluno", back_populates="pagamentos")