import logging
from typing import Dict, Any

from app.schemas.workload import (
    WorkloadPredictionRequest,
    WorkloadPredictionResponse,
    HealthResponse,
)
from app.ml.inference.forecaster import forecaster
from app.core.config import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class WorkloadService:
    """
    Business service layer managing prediction requests and system health telemetry.
    """

    @staticmethod
    def predict_workload(request: WorkloadPredictionRequest) -> WorkloadPredictionResponse:
        raw_dict = request.model_dump()
        result_dict = forecaster.predict(raw_dict)
        return WorkloadPredictionResponse(**result_dict)

    @staticmethod
    def get_health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            service="shramsetu-ai",
            version=settings.VERSION,
            model_loaded=forecaster.model_loaded,
            model_path=str(settings.WORKLOAD_MODEL_PATH),
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

workload_service = WorkloadService()

