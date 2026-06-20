from __future__ import annotations

import argparse
from getpass import getpass

from app.core.security import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera hash bcrypt para NOSIGNAL_AUTH_USERS.")
    parser.add_argument("--password", help="Password en texto claro. Si no se envía, se pide por prompt.")
    args = parser.parse_args()

    password = args.password or getpass("Password: ")
    if not password.strip():
        raise SystemExit("Password vacío.")
    print(hash_password(password))


if __name__ == "__main__":
    main()
