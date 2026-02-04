import httpx
from app.config.settings import settings


class AsaasService:
    """
    Serviço para integração com a API do Asaas.
    Usa sandbox por padrão. Troca ASAAS_BASE_URL para produção.
    Docs: https://developers.asaas.com.br/
    """

    def __init__(self):
        self.base_url = settings.ASAAS_BASE_URL
        self.headers = {
            "app_token": settings.ASAAS_API_KEY,
            "Content-Type": "application/json",
        }

    # ─────────────────────────────────────────
    # Cliente (Cliente no Asaas = Aluno no BudoManager)
    # ─────────────────────────────────────────
    async def criar_cliente(self, nome: str, cpf: str) -> dict:
        """Cria um cliente no Asaas."""
        payload = {"name": nome, "cpfCnpj": cpf}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/customers",
                json=payload,
                headers=self.headers,
            )
        return response.json()

    async def buscar_cliente_por_cpf(self, cpf: str) -> dict | None:
        """Busca cliente pelo CPF no Asaas."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/customers",
                params={"cpfCnpj": cpf},
                headers=self.headers,
            )
        data = response.json()
        items = data.get("data", [])
        return items[0] if items else None

    # ─────────────────────────────────────────
    # Pagamento (cobrança única)
    # ─────────────────────────────────────────
    async def criar_pagamento(self, customer_id: str, valor: float, vencimento: str) -> dict:
        """
        Cria uma cobrança no Asaas.
        - customer_id: ID do cliente no Asaas
        - valor: valor em reais (ex: 149.00)
        - vencimento: data no formato YYYY-MM-DD
        """
        payload = {
            "customer": customer_id,
            "billingType": "BOLETO",  # BOLETO | CREDIT_CARD | PIX
            "value": valor,
            "dueDate": vencimento,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self.headers,
            )
        return response.json()

    async def buscar_pagamento(self, payment_id: str) -> dict:
        """Busca status de um pagamento pelo ID."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self.headers,
            )
        return response.json()

    # ─────────────────────────────────────────
    # Assinatura (recorrência mensal)
    # ─────────────────────────────────────────
    async def criar_assinatura(self, customer_id: str, valor: float) -> dict:
        """
        Cria uma assinatura recorrente mensal no Asaas.
        Useful para cobrar mensalidade automaticamente.
        """
        payload = {
            "customer": customer_id,
            "billingType": "BOLETO",
            "value": valor,
            "nextDueDate": None,  # Vai ser preenchido automaticamente pelo Asaas
            "cycle": 1,           # 1 = mensal
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/subscriptions",
                json=payload,
                headers=self.headers,
            )
        return response.json()


# Instância global para uso nas routes
asaas_service = AsaasService()