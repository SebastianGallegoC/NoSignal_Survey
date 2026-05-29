from typing import Any

from pydantic import BaseModel, Field


class FormReadItem(BaseModel):
    """Formulario persistido (lectura); las fotos son rutas en disco del servidor, no base64."""

    id_formulario: str
    fecha_hora: str
    fecha_actualizacion: str
    latitud: float
    longitud: float
    precision: float | None = Field(default=None, description="No almacenada en BD; null.")
    datos_formulario: dict[str, Any] = Field(default_factory=dict)
    fotos: list[Any] = Field(default_factory=list)


class FormListResponse(BaseModel):
    items: list[FormReadItem]
