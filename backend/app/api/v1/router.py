from fastapi import APIRouter

from . import auth, forms

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
