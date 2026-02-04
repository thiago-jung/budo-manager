import asyncio
import sys

# ISSO PRECISA SER A LINHA 1 E 2 DO ARQUIVO
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config.database import engine, Base
from app.routes import auth, alunos, pagamentos, presencas, dojos

print(f"DEBUG: DATABASE_URL -> {engine.url}")


# ─────────────────────────────────────────────
# Lifespan: cria tabelas ao iniciar o servidor
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tabelas criadas / verificadas com sucesso.")
    yield


# ─────────────────────────────────────────────
# App principal
# ─────────────────────────────────────────────
app = FastAPI(
    title="BudoManager API",
    description="API do sistema de gestão para dojos de artes marciais.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — permite o frontend (Next.js) chamar a API em desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL do Next.js em dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Routers registrados
# ─────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(alunos.router)
app.include_router(pagamentos.router)
app.include_router(presencas.router)
app.include_router(dojos.router)


# ─────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "app": "BudoManager"}