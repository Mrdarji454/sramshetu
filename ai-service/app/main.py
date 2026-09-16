import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.endpoints.workload import router as workload_router
from app.schemas.workload import (
    WorkloadPredictionRequest,
    WorkloadPredictionResponse,
    HealthResponse,
)
from app.services.workload_service import workload_service
from app.ml.inference.forecaster import forecaster

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("shramsetu-ai")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: attempt to load model artifact or verify heuristic fallback
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    forecaster.load_model()
    if forecaster.model_loaded:
        logger.info("XGBoost workload model active and ready.")
    else:
        logger.info("Running in zero-downtime mock/heuristic fallback mode.")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")

app = FastAPI(
    title="ShramSetu AI Microservice",
    description=(
        "Production AI/ML Microservice for ShramSetu (SIH 2026). "
        "Provides service-demand and workload forecasting, dynamic capacity strain analytics, "
        "and fair cooperative labor dispatch optimization."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Root-Level Endpoints (as explicitly requested: GET /health and POST /predict/workload)
@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    tags=["System Health"],
)
def root_health():
    return workload_service.get_health()

@app.post(
    "/predict/workload",
    response_model=WorkloadPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict workload and service demand",
    tags=["Workload Forecasting"],
)
def root_predict_workload(request: WorkloadPredictionRequest):
    return workload_service.predict_workload(request)

# 2. Versioned API Router Mount (/api/v1/health, /api/v1/predict/workload)
app.include_router(workload_router, prefix=settings.API_V1_STR)

# 3. Root welcome endpoint
@app.get("/", tags=["System Health"])
def root_welcome():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "endpoints": {
            "health": "/health",
            "predict_workload": "/predict/workload",
            "docs": "/docs",
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

