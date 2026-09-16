from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional, Dict, Any

class WorkloadPredictionRequest(BaseModel):
    """
    Input contract for service-demand and workload forecasting.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "applications_last_7_days": 42,
                "applications_last_30_days": 160,
                "pending_applications": 18,
                "expiring_requests": 3,
                "district": "Pune",
                "service_type": "Electrical & Power Systems",
                "number_of_workers": 85,
                "available_workers": 24,
                "average_completion_time": 3.5,
            }
        }
    )

    applications_last_7_days: int = Field(
        ..., ge=0, description="Service applications received in the last 7 days"
    )
    applications_last_30_days: int = Field(
        ..., ge=0, description="Service applications received in the last 30 days"
    )
    pending_applications: int = Field(
        ..., ge=0, description="Current unassigned or pending work queue"
    )
    expiring_requests: int = Field(
        ..., ge=0, description="Work requests nearing SLA turnaround deadline"
    )
    district: str = Field(
        ..., min_length=1, description="Target district or jurisdiction"
    )
    service_type: str = Field(
        ..., min_length=1, description="Trade classification or service category"
    )
    number_of_workers: int = Field(
        ..., ge=1, description="Total registered cooperative workers in this trade and region"
    )
    available_workers: int = Field(
        ..., ge=0, description="Currently active and available workers"
    )
    average_completion_time: float = Field(
        ..., gt=0.0, description="Average job completion duration in hours"
    )


class WorkloadPredictionResponse(BaseModel):
    """
    Output contract for service-demand and workload forecasting.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "predicted_demand": 48.6,
                "predicted_inspections": 10.2,
                "workload_level": "High",
                "priority_score": 78.4,
                "model_version": "1.0.0",
                "inference_mode": "xgboost",
                "insights": {
                    "worker_utilization": 0.718,
                    "workload_strain_index": 1.64,
                    "demand_velocity": 1.12,
                    "recommendation": "Deploy standby guild roster to avoid SLA breach.",
                },
            }
        }
    )

    predicted_demand: float = Field(
        ..., description="Forecasted service demand volume for the upcoming 7-day period"
    )
    predicted_inspections: float = Field(
        ..., description="Forecasted quality and verification inspections required"
    )
    workload_level: Literal["Low", "Moderate", "High", "Critical"] = Field(
        ..., description="Categorized capacity stress level"
    )
    priority_score: float = Field(
        ..., ge=0.0, le=100.0, description="Normalized urgency priority score (0.0 - 100.0)"
    )
    model_version: str = Field(
        default="1.0.0", description="Model version tag"
    )
    inference_mode: Literal["xgboost", "heuristic_mock"] = Field(
        ..., description="Whether inference was generated via trained XGBoost or domain heuristic fallback"
    )
    insights: Optional[Dict[str, Any]] = Field(
        default_factory=dict, description="Diagnostic and dispatch planning insights"
    )


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "shramsetu-ai"
    version: str = "1.0.0"
    model_loaded: bool
    model_path: str
    timestamp: str

