import httpx
from app.config.settings import settings


class EvolutionService:
    """
    Serviço para enviar mensagens via WhatsApp usando Evolution API.
    Docs: https://docs.evolution-api.com/
    """

    def __init__(self):
        self.base_url = settings.EVOLUTION_API_URL
        self.headers = {
            "apikey": settings.EVOLUTION_API_KEY,
            "Content-Type": "application/json",
        }

    async def enviar_mensagem(self, numero: str, mensagem: str, instancia: str = "budomanager") -> dict:
        """
        Envia uma mensagem de texto via WhatsApp.
        - numero: número do aluno no formato 55XXXXXXXXXXXX (com código do país)
        - mensagem: texto da mensagem
        - instancia: nome da instância Evolution configurada
        """
        # Normaliza o número (remove caracteres não numéricos)
        numero_limpo = "".join(filter(str.isdigit, numero))
        if not numero_limpo.startswith("55"):
            numero_limpo = "55" + numero_limpo

        payload = {
            "number": numero_limpo,
            "message": mensagem,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/message/sendText/{instancia}",
                json=payload,
                headers=self.headers,
            )
        return response.json()

    # ─────────────────────────────────────────
    # Templates de mensagem (Régua de Cobrança)
    # ─────────────────────────────────────────
    def template_cobranca_pendente(self, nome_aluno: str, valor: float, vencimento: str) -> str:
        return (
            f"Olá, {nome_aluno}! 👋\n\n"
            f"Lembrando que sua mensalidade de R$ {valor:.2f} vence em {vencimento}.\n\n"
            f"Caso já tenha pago, ignore esta mensagem. 🙏\n\n"
            f"— BudoManager"
        )

    def template_cobranca_atraso(self, nome_aluno: str, valor: float, dias_atraso: int) -> str:
        return (
            f"Olá, {nome_aluno}! ⚠️\n\n"
            f"Sua mensalidade de R$ {valor:.2f} está em atraso há {dias_atraso} dia(s).\n\n"
            f"Por favor, regularize seu pagamento para continuar suas aulas.\n\n"
            f"Dúvidas? Fale com seu professor. 🥋\n\n"
            f"— BudoManager"
        )

    def template_pagamento_confirmado(self, nome_aluno: str, valor: float) -> str:
        return (
            f"Olá, {nome_aluno}! ✅\n\n"
            f"Seu pagamento de R$ {valor:.2f} foi confirmado com sucesso!\n\n"
            f"Nos vemos na aula! 🥋\n\n"
            f"— BudoManager"
        )


# Instância global
evolution_service = EvolutionService()