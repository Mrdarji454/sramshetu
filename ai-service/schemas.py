"""
ShramSetu AI Service - Schemas (Phase 12)
Modular Pydantic schemas for workload demand forecasting and health checks.

DISCLAIMER:
All datasets, metrics, and forecasting models utilize synthetic demonstration data
to model fair cooperative labor dispatch workflows. They do NOT represent real
government records, labor census data, or official ministry statistics.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class WorkloadPredictionRequest(BaseModel):
    """
    Input schema for workload demand forecasting.
    Supports both queue-based features and operational service telemetry.
    """
    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "pending_bookings": 32,
                "available_workers": 14,
                "avg_completion_time": 3.5,
                "day_of_week": "Monday",
            }
        }
    )

    pending_bookings: Optional[int] = Field(
        default=None,
        description="Current volume of pending bookings in the cooperative queue",
    )
    available_workers: int = Field(
        ...,
        ge=0,
        description="Number of cooperative workers currently online and unassigned",
    )
    avg_completion_time: Optional[float] = Field(
        default=None,
        description="Average turnaround time to complete jobs in hours",
    )
    day_of_week: Optional[str] = Field(
        default=None,
        description="Day of the week (e.g., 'Monday', 'Tuesday', ..., 'Sunday')",
    )

    # Operational aliases
    applications_last_7_days: Optional[int] = None
    applications_last_30_days: Optional[int] = None
    pending_applications: Optional[int] = None
    average_completion_time: Optional[float] = None
    district: Optional[str] = None
    service_type: Optional[str] = None
    expiring_requests: Optional[int] = None
    number_of_workers: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Resolve pending_bookings
            if data.get("pending_bookings") is None:
                if data.get("pending_applications") is not None:
                    data["pending_bookings"] = data["pending_applications"]
                elif data.get("pendingApplications") is not None:
                    data["pending_bookings"] = data["pendingApplications"]
            
            # Check negative pending_bookings
            if data.get("pending_bookings") is not None and data["pending_bookings"] < 0:
                raise ValueError("pending_bookings must be non-negative")

            # Resolve avg_completion_time
            if data.get("avg_completion_time") is None:
                if data.get("average_completion_time") is not None:
                    data["avg_completion_time"] = data["average_completion_time"]
                elif data.get("averageCompletionTime") is not None:
                    data["avg_completion_time"] = data["averageCompletionTime"]

            # Check positive avg_completion_time
            if data.get("avg_completion_time") is not None and data["avg_completion_time"] <= 0:
                raise ValueError("avg_completion_time must be positive")

            # Resolve day_of_week
            if not data.get("day_of_week"):
                data["day_of_week"] = "Monday"

            # Check required fields
            if data.get("pending_bookings") is None:
                raise ValueError("Missing required field: pending_bookings / pending_applications")
            if data.get("avg_completion_time") is None:
                raise ValueError("Missing required field: avg_completion_time / average_completion_time")

        return data


class WorkloadPredictionResponse(BaseModel):
    """
    Response schema returning predictedDemand and derived workload metrics.
    """
    model_config = ConfigDict(
        extra="allow",
        json_schema_extra={
            "example": {
                "predictedDemand": 45.2,
                "predictedInspections": 10.0,
                "workloadLevel": "MODERATE",
                "priorityScore": 65,
                "status": "success",
                "model_version": "1.2.0",
                "disclaimer": "Synthetic demonstration data - not official government records",
            }
        }
    )

    predictedDemand: float = Field(
        ...,
        description="Forecasted actual demand score/volume for service dispatch",
    )
    predictedInspections: Optional[float] = Field(
        default=None,
        description="Projected statutory inspections/verifications",
    )
    workloadLevel: Optional[str] = Field(
        default=None,
        description="Capacity strain level (LOW, MODERATE, HIGH, CRITICAL)",
    )
    priorityScore: Optional[float] = Field(
        default=None,
        description="Resource prioritization score (0 - 100)",
    )

    # Snake_case aliases for Phase 11 compatibility
    predicted_demand: Optional[float] = None
    predicted_inspections: Optional[float] = None
    workload_level: Optional[str] = None
    priority_score: Optional[float] = None

    status: str = Field(
        default="success",
        description="Inference response status",
    )
    model_version: str = Field(
        default="1.2.0",
        description="Trained model release version",
    )
    disclaimer: str = Field(
        default="Synthetic demonstration data - not official government records",
        description="Mandatory demonstration notice",
    )


class HealthResponse(BaseModel):
    """
    Service health and artifact availability schema.
    """
    status: str = "ok"
    service: str = "shramsetu-ai"
    version: str = "1.2.0"
    model_loaded: bool = False
    disclaimer: str = "Synthetic demonstration data - not official government records"

