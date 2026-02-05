# 🥋 BudoManager — SaaS para Dojos de Artes Marciais

Sistema de gestão inteligente para dojos: cadastro de alunos, cobrança automática via Asaas, notificações por WhatsApp e controle de presença.

---

## 📁 Estrutura do Projeto

```
budomanager/
├── backend/            # Python (FastAPI) — API REST
├── frontend/           # Next.js (React) — Interface web
└── README.md           # Este arquivo
```

---

## 🚀 Como Rodar (Passo a Passo)

### 1. Backend

```bash
# Entre na pasta do backend
cd backend

source venv/Scripts/activate

# Instale as dependências
pip install -r requirements.txt

pip install -r requirements.txt

# Inicie o banco de dados PostgreSQL local com Docker
docker compose up -d

# Inicie o servidor da API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

A API estará disponível em: **http://localhost:8000**
Documentação automática (Swagger): **http://localhost:8000/docs**

---

### 2. Frontend

```bash
# Em outro terminal, entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: **http://localhost:3000**

---

## 🌐 Endpoints da API (Resumo)

| Método | Endpoint                      | Descrição                          |
|--------|-------------------------------|------------------------------------|
| POST   | `/auth/register`              | Cadastrar usuário (professor)      |
| POST   | `/auth/login`                 | Login e geração de token JWT       |
| POST   | `/alunos`                     | Cadastrar aluno                    |
| GET    | `/alunos`                     | Listar alunos do dojo              |
| PUT    | `/alunos/{id}`                | Atualizar dados do aluno           |
| DELETE | `/alunos/{id}`                | Desativar aluno (soft delete)      |
| POST   | `/pagamentos`                 | Criar cobrança (integra Asaas)     |
| GET    | `/pagamentos`                 | Listar pagamentos do dojo          |
| POST   | `/pagamentos/webhook`         | Webhook do Asaas (status automático)|
| POST   | `/presencas`                  | Registrar presença manualmente     |
| POST   | `/presencas/qrcode/{aluno_id}`| Check-in via QR Code              |
| GET    | `/presencas/aluno/{id}`       | Histórico de presença              |
| GET    | `/presencas/resumo/{id}`      | Resumo estatístico (frequência)    |

---

## ⚙️ Variáveis de Ambiente (.env)

| Variável                | Descrição                                    |
|-------------------------|----------------------------------------------|
| `DATABASE_URL`          | URL do PostgreSQL (Docker local)             |
| `SECRET_KEY`            | Chave secreta para JWT                       |
| `ASAAS_API_KEY`         | Chave da API do Asaas                        |
| `ASAAS_BASE_URL`        | URL base do Asaas (sandbox ou produção)      |
| `EVOLUTION_API_URL`     | URL da sua instância Evolution API           |
| `EVOLUTION_API_KEY`     | Chave da Evolution API                       |
| `SUPABASE_URL`          | URL do projeto Supabase (para storage futuro)|
| `SUPABASE_KEY`          | Key do Supabase                              |

---

## 📋 Próximos Passos (após o MVP rodar)

1. **QR Code visual** — Gerar QR codes no frontend para check-in de presença.
2. **Webhook Asaas** — Configurar URL do webhook no painel do Asaas apontando para `/pagamentos/webhook`.
3. **Régua de cobrança** — Criar um job agendado (cron) para disparar WhatsApp automático para inadimplentes.
4. **Predição de Churn** — Usar dados de presença coletados para treinar modelo ML em Python.
5. **Graduação automática** — Lógica de rastreio de tempo + requisitos para exames de faixa.

---

## 🛠️ Tech Stack

| Camada     | Tecnologia                | Por quê                                  |
|------------|---------------------------|------------------------------------------|
| Backend    | Python + FastAPI          | Rápido, async nativo, suporte a ML       |
| Frontend   | Next.js 14 (React)        | SEO, performance, roteamento automático  |
| Banco      | PostgreSQL (Docker local) | Robusto, relacional, compatível com Supabase |
| Pagamentos | Asaas API                 | Boleto, Pix, cartão com taxa menor       |
| WhatsApp   | Evolution API             | Envio de notificações automáticas        |
| Auth       | JWT (python-jose)         | Stateless, seguro, simples               |
