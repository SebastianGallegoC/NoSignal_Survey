from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.encuestador_profile import EncuestadorProfile
from app.models.form_record import FormRecord


def _base_stmt() -> Select[tuple[EncuestadorProfile]]:
    return (
        select(EncuestadorProfile)
        .order_by(EncuestadorProfile.nombres_apellidos_encuestador.asc(), EncuestadorProfile.id.asc())
    )


async def list_profiles(session: AsyncSession) -> list[EncuestadorProfile]:
    result = await session.execute(_base_stmt())
    return list(result.scalars().all())


async def list_enabled_profiles(session: AsyncSession) -> list[EncuestadorProfile]:
    result = await session.execute(_base_stmt().where(EncuestadorProfile.habilitado.is_(True)))
    return list(result.scalars().all())


async def get_profile_by_id(
    session: AsyncSession,
    profile_id: int,
) -> EncuestadorProfile | None:
    result = await session.execute(
        select(EncuestadorProfile).where(EncuestadorProfile.id == profile_id)
    )
    return result.scalars().first()


async def count_forms_using_profile(session: AsyncSession, profile_id: int) -> int:
    result = await session.execute(
        select(func.count()).select_from(FormRecord).where(FormRecord.id_perfil_encuestador == profile_id)
    )
    return int(result.scalar_one() or 0)


async def count_forms_grouped_by_profile_ids(
    session: AsyncSession,
    profile_ids: list[int],
) -> dict[int, int]:
    if not profile_ids:
        return {}
    result = await session.execute(
        select(FormRecord.id_perfil_encuestador, func.count())
        .where(FormRecord.id_perfil_encuestador.in_(profile_ids))
        .group_by(FormRecord.id_perfil_encuestador)
    )
    counts: dict[int, int] = {}
    for profile_id, total in result.all():
        if profile_id is not None:
            counts[int(profile_id)] = int(total or 0)
    return counts


async def create_profile(
    session: AsyncSession,
    profile: EncuestadorProfile,
) -> EncuestadorProfile:
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def save_profile(session: AsyncSession, profile: EncuestadorProfile) -> EncuestadorProfile:
    await session.commit()
    await session.refresh(profile)
    return profile


async def delete_profile(session: AsyncSession, profile: EncuestadorProfile) -> None:
    await session.delete(profile)
    await session.commit()
