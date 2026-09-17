"""
ShramSetu AI Service - FastAPI Microservice (Phase 12)

Provides real-time workload demand forecasting endpoints powered by an XGBoost regressor
trained on modular synthetic data for cooperative labor operations.

DOCUMENTATION & COMPLIANCE DISCLAIMER:
All models, endpoints, and datasets utilize synthetic demonstration data designed
solely to demonstrate intelligent dispatch and queue forecasting in ShramSetu.
This system does NOT process or reflect real government labor records.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from predictor import predictor
from schemas import (
    WorkloadPredictionRequest,
    WorkloadPredictionResponse,
    HealthResponse,
)

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("shramsetu.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifespan event.
    Initializes predictor and loads serialized joblib artifacts.
    """
    logger.info("Initializing ShramSetu AI Service (Phase 12)...")
    loaded = predictor.load_artifacts()
    if loaded:
        logger.info("XGBoost workload model and LabelEncoder loaded successfully.")
    else:
        logger.warning("Running in heuristic fallback mode until train.py is executed.")
    yield
    logger.info("ShramSetu AI Service shutting down...")


app = FastAPI(
    title="ShramSetu AI Service - Workload Forecasting",
    description=(
        "Phase 12 XGBoost Workload Demand Forecasting Microservice. "
        "Predicts labor demand based on pending bookings, available workers, "
        "average turnaround time, and day of week. "
        "NOTE: Uses synthetic demonstration data, not real government data."
    ),
    version="1.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend and server communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="System health and model status check",
    tags=["System Health"],
)
def get_health():
    """
    Returns service health status and artifact availability.
    """
    return HealthResponse(
        status="ok",
        service="shramsetu-ai",
        version="1.2.0",
        model_loaded=predictor.model_loaded,
        disclaimer="Synthetic demonstration data - not official government records",
    )


@app.post(
    "/predict/workload",
    response_model=WorkloadPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict cooperative workload demand",
    tags=["Workload Forecasting"],
)
def predict_workload(request: WorkloadPredictionRequest):
    """
    Predicts workload demand for cooperative labor dispatch.

    Features:
      - pending_bookings: Number of bookings currently in the queue
      - available_workers: Number of available workers in the cooperative
      - avg_completion_time: Average duration of tasks in hours
      - day_of_week: Day of the week (e.g. 'Monday', 'Tuesday')

    Returns:
      - predictedDemand (float): JSON containing forecasted demand score
    """
    predicted_demand = predictor.predict(
        pending_bookings=request.pending_bookings,
        available_workers=request.available_workers,
        avg_completion_time=request.avg_completion_time,
        day_of_week=request.day_of_week,
    )

    active_workers = max(request.available_workers, 1)
    strain = predicted_demand / active_workers
    if (request.available_workers == 0 and request.pending_bookings > 0) or strain >= 2.0:
        level = "CRITICAL"
    elif strain >= 1.2:
        level = "HIGH"
    elif strain >= 0.7:
        level = "MODERATE"
    else:
        level = "LOW"

    pred_inspections = round(predicted_demand * 0.22, 2)
    priority = round(min(100.0, max(10.0, (strain / 2.0) * 50.0 + (request.pending_bookings / 40.0) * 35.0 + 15.0)), 1)

    return WorkloadPredictionResponse(
        predictedDemand=predicted_demand,
        predictedInspections=pred_inspections,
        workloadLevel=level,
        priorityScore=priority,
        predicted_demand=predicted_demand,
        predicted_inspections=pred_inspections,
        workload_level=level,
        priority_score=priority,
        status="success",
        model_version="1.2.0",
        disclaimer="Synthetic demonstration data - not official government records",
    )


@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    summary="Root metadata and documentation",
    tags=["System Health"],
)
def root_info():
    """
    Provides microservice metadata and synthetic data advisory.
    """
    return {
        "service": "ShramSetu AI Microservice",
        "phase": 12,
        "version": "1.2.0",
        "notice": "Demonstration system utilizing synthetic data, not real government records.",
        "endpoints": {
            "predict_workload": "POST /predict/workload",
            "health": "GET /health",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

