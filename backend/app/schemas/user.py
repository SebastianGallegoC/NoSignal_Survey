from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field, field_validator


class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    ENCUESTADOR = "encuestador"


class UserRead(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: str
    updated_at: str


class UserListResponse(BaseModel):
    items: list[UserRead]


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=128)
    password: str = Field(min_length=8, max_length=256)
    role: UserRole

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("username_required")
        if any(ch.isspace() for ch in normalized):
            raise ValueError("username_no_spaces")
        return normalized

    @field_validator("role")
    @classmethod
    def forbid_admin_role(cls, value: UserRole) -> UserRole:
        if value == UserRole.ADMIN:
            raise ValueError("admin_role_creation_forbidden")
        return value


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=256)


class UserMe(BaseModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
