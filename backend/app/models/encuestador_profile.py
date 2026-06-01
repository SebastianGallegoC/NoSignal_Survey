from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class EncuestadorProfile(Base):
    __tablename__ = "encuestador_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username_owner = Column(String, nullable=False, index=True)
    nombres_apellidos_encuestador = Column(String, nullable=False)
    tipo_documento_encuestador = Column(String, nullable=False)
    numero_documento_encuestador = Column(String, nullable=False)
    telefono_encuestador = Column(String, nullable=False)
    cargo_encuestador = Column(String, nullable=False)
    empresa_entidad_encuestador = Column(String, nullable=False)
    firma_encuestador = Column(String, nullable=False)
    habilitado = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
