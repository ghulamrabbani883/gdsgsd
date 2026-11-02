from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import dashboard, forecasts, analytics


app = FastAPI(
    title=settings.app_name,
    description=(
        "Wind generation forecast intelligence "
        "and forecast accuracy analytics."
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Elexon Wind Intelligence API",
        "status": "running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy"
    }


app.include_router(
    dashboard.router,
    prefix=settings.api_prefix
)

app.include_router(
    forecasts.router,
    prefix=settings.api_prefix
)

app.include_router(
    analytics.router,
    prefix=settings.api_prefix
)