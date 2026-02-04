import asyncio
import asyncpg
import sys

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def test():
    try:
        # Usando as credenciais do seu docker-compose
        conn = await asyncpg.connect(
            user='budo_user',
            password='budo_pass',
            database='budomanager',
            host='127.0.0.1',
            port=5432
        )
        print("✅ CONECTADO COM SUCESSO!")
        await conn.close()
    except Exception as e:
        print(f"❌ ERRO: {e}")

if __name__ == "__main__":
    asyncio.run(test())
