from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Banco de Dados
    DATABASE_URL: str = "postgresql+psycopg://budo_user:budo_pass@127.0.0.1:5435/budomanager"
    # Segurança
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Asaas
    ASAAS_API_KEY: str = ""
    ASAAS_BASE_URL: str = "https://sandbox.asaas.com/api/v3"

    # Supabase (se for usar)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL: str = ""
    EVOLUTION_API_KEY: str = ""

    # Configuração do Pydantic para ler o .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Ignora variáveis extras no .env que não estão aqui
    )

settings = Settings()