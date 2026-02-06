import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Importe o Base e o Settings do seu projeto
from app.models.models import Base
from app.config.settings import settings

config = context.config

# Força o Alembic a usar a URL do seu .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    # Cria o engine assíncrono
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        # Aqui é onde o erro de Greenlet é resolvido
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    # Para o modo offline (opcional)
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    # Inicia o loop de eventos para o modo online
    asyncio.run(run_migrations_online())