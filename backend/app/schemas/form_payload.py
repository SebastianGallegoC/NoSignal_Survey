import re
from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.gps_limits import load_gps_limits

MAX_GPS_ACCURACY_METERS = float(load_gps_limits()["maxGpsAccuracyMeters"])


class GPSPayload(BaseModel):
    latitud: float
    longitud: float
    precision: float = Field(gt=0)

    @field_validator("precision")
    @classmethod
    def validate_precision(cls, value: float) -> float:
        if value > MAX_GPS_ACCURACY_METERS:
            raise ValueError("gps_precision_exceeded")
        return value


class PhotoPayload(BaseModel):
    nombre_archivo: str
    data: str
    slot: Literal[1, 2, 3, 4, 5, 6]
    visita: Literal[1, 2, 3, 4] | None = None

    @field_validator("data")
    @classmethod
    def validate_data(cls, value: str) -> str:
        """Acepta data URL estándar (cualquier casing) o JPEG en base64 plano sin prefijo."""
        if not isinstance(value, str):
            raise ValueError("invalid_image_payload")
        v = value.strip()
        if re.match(r"(?i)^data:image/", v):
            return v
        compact = "".join(v.split())
        if len(compact) >= 64 and re.fullmatch(r"[A-Za-z0-9+/=]+", compact):
            return f"data:image/jpeg;base64,{compact}"
        raise ValueError("invalid_image_payload")


class FormPayload(BaseModel):
    id_formulario: str
    id_perfil_encuestador: int | None = None
    fecha_hora: str = Field(
        ...,
        description="Momento del primer registro / envío inicial (en actualizaciones debe conservarse).",
    )
    fecha_actualizacion: str | None = Field(
        default=None,
        description="ISO 8601 del último guardado; si falta se usa fecha_hora (compat. clientes viejos).",
    )
    gps: GPSPayload
    datos_formulario: Dict[str, Any] = Field(default_factory=dict)
    fotos: List[PhotoPayload] = Field(default_factory=list)

    @field_validator("fecha_actualizacion", mode="before")
    @classmethod
    def blank_fecha_actualizacion_to_none(cls, value: object) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            s = value.strip()
            return s if s else None
        return None

    @field_validator("id_perfil_encuestador")
    @classmethod
    def validate_id_perfil_encuestador(cls, value: int | None) -> int | None:
        if value is not None and value <= 0:
            raise ValueError("encuestador_profile_invalid")
        return value

    @field_validator("fotos")
    @classmethod
    def validate_fotos(cls, value: List[PhotoPayload]) -> List[PhotoPayload]:
        if len(value) > 6:
            raise ValueError("photos_out_of_range")
        slots = [foto.slot for foto in value]
        if len(slots) != len(set(slots)):
            raise ValueError("photos_duplicate_slot")
        return value

    @model_validator(mode="after")
    def validate_encuestado_nombre(self) -> "FormPayload":
        datos = self.datos_formulario or {}
        nombre = str(datos.get("nombres_apellidos_encuestado") or "").strip()
        if not nombre:
            raise ValueError("encuestado_name_required")
        return self
