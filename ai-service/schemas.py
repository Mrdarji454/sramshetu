"""
ShramSetu AI Service - Schemas (Phase 12)
Modular Pydantic schemas for workload demand forecasting and health checks.

DISCLAIMER:
All datasets, metrics, and forecasting models utilize synthetic demonstration data
to model fair cooperative labor dispatch workflows. They do NOT represent real
government records, labor census data, or official ministry statistics.
"""

from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class WorkloadPredictionRequest(BaseModel):
    """
    Input schema for workload demand forecasting.
    Features:
      - pending_bookings: Number of unassigned bookings awaiting worker dispatch
      - available_workers: Count of active and available cooperative workers
      - avg_completion_time: Average time in hours taken to complete a task
      - day_of_week: Day of the week (e.g., 'Monday', 'Tuesday', ..., 'Sunday')
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pending_bookings": 32,
                "available_workers": 14,
                "avg_completion_time": 3.5,
                "day_of_week": "Monday",
            }
        }
    )

    pending_bookings: int = Field(
        ...,
        ge=0,
        description="Current volume of pending bookings in the cooperative queue",
    )
    available_workers: int = Field(
        ...,
        ge=0,
        description="Number of cooperative workers currently online and unassigned",
    )
    avg_completion_time: float = Field(
        ...,
        gt=0.0,
        description="Average turnaround time to complete jobs in hours",
    )
    day_of_week: str = Field(
        ...,
        min_length=3,
        description="Day of the week (e.g., 'Monday', 'Tuesday', ..., 'Sunday')",
    )


class WorkloadPredictionResponse(BaseModel):
    """
    Response schema returning predictedDemand as JSON.
    """
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "predictedDemand": 45.2,
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

