from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.core.config import settings
from app.schemas.user import UserRole


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, stored_hash: str) -> bool:
    value = (stored_hash or "").strip()
    if not value:
        return False
    digest = value.removeprefix("bcrypt:").encode("utf-8")
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), digest)
    except ValueError:
        return False


def create_access_token(subject: str, role: UserRole, user_id: int) -> tuple[str, int]:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {
        "sub": subject,
        "role": role.value,
        "uid": user_id,
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int(expire.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    expires_in = int(timedelta(minutes=settings.jwt_expires_minutes).total_seconds())
    return token, expires_in


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
