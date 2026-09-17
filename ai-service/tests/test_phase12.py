"""
Tests for Phase 12: XGBoost Training Pipeline & FastAPI Workload Predictor

Validates:
1. Synthetic dataset generation (1,000 records, labeled columns, value constraints).
2. Categorical preprocessing via Scikit-Learn LabelEncoder.
3. Model training with XGBRegressor, evaluation using Mean Absolute Error (MAE).
4. Artifact serialization and loading with joblib.
5. FastAPI endpoint POST /predict/workload returning predictedDemand as JSON.
6. Documentation & synthetic data notices.
"""

import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure ai-service root is in sys.path
import sys
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from train import (
    generate_synthetic_dataset,
    preprocess_data,
    train_xgboost_pipeline,
    DAYS_OF_WEEK,
    MODEL_FILE,
    ENCODER_FILE,
    DATASET_CSV_FILE,
    METADATA_FILE,
)
from predictor import WorkloadPredictor, predictor
from schemas import WorkloadPredictionRequest, WorkloadPredictionResponse
from main import app


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


def test_synthetic_dataset_generation():
    """Verify synthetic dataset produces exactly 1,000 rows with required features and target."""
    df = generate_synthetic_dataset(n_samples=1000, random_state=42)
    assert len(df) == 1000

    required_features = ["pending_bookings", "available_workers", "avg_completion_time", "day_of_week"]
    for feat in required_features:
        assert feat in df.columns, f"Missing feature: {feat}"

    assert "actual_demand" in df.columns, "Missing target: actual_demand"

    # Value constraints
    assert (df["pending_bookings"] >= 0).all()
    assert (df["available_workers"] >= 0).all()
    assert (df["avg_completion_time"] > 0).all()
    assert df["day_of_week"].isin(DAYS_OF_WEEK).all()
    assert (df["actual_demand"] > 0).all()


def test_categorical_preprocessing_label_encoder():
    """Verify LabelEncoder preprocesses day_of_week correctly."""
    df = generate_synthetic_dataset(n_samples=100, random_state=42)
    X, y, encoder = preprocess_data(df)

    assert "day_of_week" in X.columns
    assert X["day_of_week"].dtype in ["int32", "int64"]

    # Check encoder classes cover all 7 days
    assert len(encoder.classes_) == 7
    for day in DAYS_OF_WEEK:
        assert day in encoder.classes_

    # Verify inverse transformation
    decoded_days = encoder.inverse_transform(X["day_of_week"])
    assert list(decoded_days) == list(df["day_of_week"])


def test_xgboost_training_pipeline_and_joblib_serialization():
    """Verify training pipeline trains XGBRegressor, computes MAE, and saves joblib artifacts."""
    results = train_xgboost_pipeline(n_samples=1000, test_size=0.2, random_state=42)

    assert results["records"] == 1000
    assert "mae" in results
    assert isinstance(results["mae"], float)
    assert results["mae"] > 0.0

    assert MODEL_FILE.exists(), f"Missing model file: {MODEL_FILE}"
    assert ENCODER_FILE.exists(), f"Missing encoder file: {ENCODER_FILE}"
    assert DATASET_CSV_FILE.exists(), f"Missing dataset CSV: {DATASET_CSV_FILE}"
    assert METADATA_FILE.exists(), f"Missing metadata JSON: {METADATA_FILE}"


def test_predictor_loads_joblib_artifacts():
    """Verify WorkloadPredictor successfully loads model and encoder from joblib."""
    pred = WorkloadPredictor(model_path=MODEL_FILE, encoder_path=ENCODER_FILE)
    assert pred.model_loaded is True
    assert pred.model is not None
    assert pred.encoder is not None

    forecast = pred.predict(
        pending_bookings=40,
        available_workers=15,
        avg_completion_time=3.5,
        day_of_week="Monday",
    )
    assert isinstance(forecast, float)
    assert forecast > 0.0


def test_fastapi_predict_workload_endpoint(client):
    """Verify POST /predict/workload returns predictedDemand as JSON."""
    # Ensure predictor has loaded the artifacts
    predictor.load_artifacts()

    payload = {
        "pending_bookings": 45,
        "available_workers": 18,
        "avg_completion_time": 4.0,
        "day_of_week": "Friday",
    }
    response = client.post("/predict/workload", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Exact field required by prompt
    assert "predictedDemand" in data
    assert isinstance(data["predictedDemand"], (int, float))
    assert data["predictedDemand"] > 0.0

    # Verify disclaimer is present
    assert "disclaimer" in data
    assert "synthetic" in data["disclaimer"].lower() or "demonstration" in data["disclaimer"].lower()


def test_fastapi_predict_workload_validation_errors(client):
    """Verify validation errors return 422 for invalid payloads."""
    # Negative pending bookings
    invalid_1 = {
        "pending_bookings": -5,
        "available_workers": 10,
        "avg_completion_time": 3.0,
        "day_of_week": "Monday",
    }
    res_1 = client.post("/predict/workload", json=invalid_1)
    assert res_1.status_code == 422

    # Missing required field
    invalid_2 = {
        "pending_bookings": 20,
        "available_workers": 10,
        # missing avg_completion_time
        "day_of_week": "Monday",
    }
    res_2 = client.post("/predict/workload", json=invalid_2)
    assert res_2.status_code == 422


def test_fastapi_health_endpoint(client):
    """Verify GET /health returns service status and model loading state."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "shramsetu-ai"
    assert "model_loaded" in data

