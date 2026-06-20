from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.sql import func

from app.core.database import Base

USER_ROLE_VALUES = ("admin", "editor", "encuestador")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(128), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SqlEnum(*USER_ROLE_VALUES, name="user_role"),
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
