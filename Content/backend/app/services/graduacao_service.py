from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.models import Aluno, Presenca, Graduacao

async def calcular_progresso_aluno(aluno_id: str, db: AsyncSession):
    # 1. Buscar o aluno e sua graduação atual
    aluno = await db.get(Aluno, aluno_id)

    # 2. Contar presenças desde a última graduação ou desde o início
    result = await db.execute(
        select(func.count(Presenca.id))
        .where(Presenca.aluno_id == aluno_id)
        .where(Presenca.presente == True)
        # Idealmente filtrar por data > data_ultima_graduacao
    )
    total_aulas = result.scalar()

    # 3. Lógica de Gamificação: Definir meta (ex: 24 aulas para a próxima faixa)
    meta_aulas = 24
    progresso = (total_aulas / meta_aulas) * 100

    return {
        "total_aulas": total_aulas,
        "progresso_percentual": min(progresso, 100),
        "pronto_para_exame": total_aulas >= meta_aulas
    }