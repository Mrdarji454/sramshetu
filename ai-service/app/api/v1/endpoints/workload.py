from fastapi import APIRouter, status
from app.schemas.workload import (
    WorkloadPredictionRequest,
    WorkloadPredictionResponse,
    HealthResponse,
)
from app.services.workload_service import workload_service

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check and ML model readiness probe",
    tags=["System Health"],
)
def check_health():
    """
    Returns service liveness, readiness, and active inference model metadata.
    """
    return workload_service.get_health()

@router.post(
    "/predict/workload",
    response_model=WorkloadPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Forecast service demand, inspections, workload level, and priority score",
    tags=["Workload Forecasting"],
)
def predict_workload(request: WorkloadPredictionRequest):
    """
    Forecasts upcoming 7-day service application demand, required quality inspections,
    capacity stress level (Low/Moderate/High/Critical), and priority score.
    """
    return workload_service.predict_workload(request)

