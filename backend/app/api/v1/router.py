from fastapi import APIRouter

from . import auth, encuestador_profiles, forms

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(
    encuestador_profiles.router,
    prefix="/encuestador-profiles",
    tags=["encuestador-profiles"],
)
