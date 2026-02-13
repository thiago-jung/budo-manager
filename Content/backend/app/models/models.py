import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import Base

class Evento(Base):
    __tablename__ = "eventos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    data_evento = Column(DateTime, nullable=False)

    # "interno" (exame/seminário) ou "publico" (campeonato/open)
    tipo = Column(String(50), default="interno")
    visivel_rede = Column(Boolean, default=False)
    promovido = Column(Boolean, default=False)

    valor_inscricao = Column(Float, default=0.0)
    status = Column(String(20), default="aberto") # aberto, em_andamento, encerrado

    # Armazena a estrutura da chave (torneio) como JSON
    chaves_json = Column(Text, nullable=True)

    criado_em = Column(DateTime, default=datetime.utcnow)

    dojo = relationship("Dojo")
    categorias = relationship("CategoriaEvento", back_populates="evento", cascade="all, delete-orphan")
    inscritos = relationship("InscricaoEvento", back_populates="evento")

class CategoriaEvento(Base):
    __tablename__ = "categorias_evento"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evento_id = Column(UUID(as_uuid=True), ForeignKey("eventos.id"), nullable=False)
    nome = Column(String(100), nullable=False) # Ex: "Absoluto", "Faixa Branca - Leve"
    genero = Column(String(20), nullable=True) # Masculino, Feminino, Misto
    peso_min = Column(Float, nullable=True)
    peso_max = Column(Float, nullable=True)
    idade_min = Column(Integer, nullable=True)
    idade_max = Column(Integer, nullable=True)
    faixa_permitida = Column(String(100), nullable=True) # Ex: "Branca,Azul"

    evento = relationship("Evento", back_populates="categorias")
    inscritos = relationship("InscricaoEvento", back_populates="categoria_rel")

class InscricaoEvento(Base):
    __tablename__ = "inscricoes_evento"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evento_id = Column(UUID(as_uuid=True), ForeignKey("eventos.id"), nullable=False)
    aluno_id = Column(UUID(as_uuid=True), ForeignKey("alunos.id"), nullable=False)
    categoria_id = Column(UUID(as_uuid=True), ForeignKey("categorias_evento.id"), nullable=True)
    pago = Column(Boolean, default=False)
    asaas_payment_id = Column(String(100), nullable=True)

    evento = relationship("Evento", back_populates="inscritos")
    categoria_rel = relationship("CategoriaEvento", back_populates="inscritos")
    aluno = relationship("Aluno")


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
    asaas_id = Column(String(255), nullable=True)

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

    data_vencimento = Column(DateTime, nullable=True)

    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    aluno = relationship("Aluno", back_populates="pagamentos")


class Presenca(Base):
    __tablename__ = "presencas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dojo_id = Column(UUID(as_uuid=True), ForeignKey("dojos.id"), nullable=False)
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
    aulas_necessarias = Column(Integer, default=0)

    dojo = relationship("Dojo")