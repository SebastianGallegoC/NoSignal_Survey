from __future__ import annotations

import argparse
import asyncio
from getpass import getpass

from app.core.database import AsyncSessionLocal
from app.schemas.user import UserCreate, UserRole
from app.services.users import create_user_account


async def _run(username: str, password: str, role: str) -> None:
    async with AsyncSessionLocal() as session:
        created = await create_user_account(
            session,
            UserCreate(
                username=username,
                password=password,
                role=UserRole(role),
            ),
        )
    print(f"Usuario creado: {created.username} ({created.role.value})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Crea un usuario administrador/editor/encuestador en la BD.")
    parser.add_argument("--username", required=True, help="Nombre de usuario.")
    parser.add_argument(
        "--role",
        default=UserRole.ADMIN.value,
        choices=[role.value for role in UserRole],
        help="Rol del usuario.",
    )
    parser.add_argument("--password", help="Password en texto claro. Si no se envía, se pide por prompt.")
    args = parser.parse_args()

    password = args.password or getpass("Password: ")
    if not password.strip():
        raise SystemExit("Password vacío.")
    asyncio.run(_run(args.username.strip(), password, args.role))


if __name__ == "__main__":
    main()
