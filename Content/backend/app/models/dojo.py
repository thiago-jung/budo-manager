import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float, Enum
)
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

    # Relacionamentos
    usuarios = relationship("Usuario", back_populates="dojo")
    alunos = relationship("Aluno", back_populates="dojo")