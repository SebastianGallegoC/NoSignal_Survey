from sqlalchemy import Column, DateTime, JSON, String
from sqlalchemy.sql import func
from geoalchemy2 import Geometry

from app.core.database import Base


class FormRecord(Base):
    __tablename__ = "forms"

    id_formulario = Column(String, primary_key=True, index=True)
    fecha_hora = Column(DateTime(timezone=True), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), nullable=False)
    gps = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    datos_formulario = Column(JSON, nullable=False)
    fotos = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
