import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ml.training.train import train_and_export_model
from app.ml.inference.forecaster import forecaster

client = TestClient(app)

SAMPLE_PAYLOAD = {
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

def test_health_endpoint():
    """Verify GET /health returns 200 and valid metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "shramsetu-ai"
    assert "version" in data
    assert "model_loaded" in data

def test_versioned_health_endpoint():
    """Verify GET /api/v1/health returns 200."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_predict_workload_mock_fallback():
    """Verify POST /predict/workload returns all required fields in heuristic/mock mode."""
    response = client.post("/predict/workload", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200
    data = response.json()

    # Core required fields
    assert "predicted_demand" in data
    assert isinstance(data["predicted_demand"], (int, float))
    assert data["predicted_demand"] > 0

    assert "predicted_inspections" in data
    assert isinstance(data["predicted_inspections"], (int, float))
    assert data["predicted_inspections"] > 0

    assert "workload_level" in data
    assert data["workload_level"] in ["Low", "Moderate", "High", "Critical"]

    assert "priority_score" in data
    assert isinstance(data["priority_score"], (int, float))
    assert 0.0 <= data["priority_score"] <= 100.0

    assert "insights" in data
    assert "recommendation" in data["insights"]

def test_predict_workload_versioned_endpoint():
    """Verify POST /api/v1/predict/workload produces identical schema."""
    response = client.post("/api/v1/predict/workload", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200
    assert "predicted_demand" in response.json()

def test_predict_workload_critical_capacity():
    """Verify that zero available workers with high pending demand outputs Critical workload."""
    critical_payload = {
        **SAMPLE_PAYLOAD,
        "available_workers": 0,
        "pending_applications": 35,
        "expiring_requests": 12,
    }
    response = client.post("/predict/workload", json=critical_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["workload_level"] == "Critical"
    assert data["priority_score"] >= 60.0

def test_predict_workload_low_stress():
    """Verify abundant worker capacity results in Low workload stress."""
    low_payload = {
        **SAMPLE_PAYLOAD,
        "applications_last_7_days": 8,
        "applications_last_30_days": 40,
        "pending_applications": 2,
        "expiring_requests": 0,
        "available_workers": 75,
        "number_of_workers": 80,
    }
    response = client.post("/predict/workload", json=low_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["workload_level"] == "Low"
    assert data["priority_score"] < 40.0

def test_validation_errors():
    """Verify Pydantic input contract validation rejects invalid data with 422."""
    # Negative applications
    invalid_1 = {**SAMPLE_PAYLOAD, "applications_last_7_days": -10}
    res_1 = client.post("/predict/workload", json=invalid_1)
    assert res_1.status_code == 422

    # Zero total workers (min is 1)
    invalid_2 = {**SAMPLE_PAYLOAD, "number_of_workers": 0}
    res_2 = client.post("/predict/workload", json=invalid_2)
    assert res_2.status_code == 422

    # Missing required field (average_completion_time)
    invalid_3 = {k: v for k, v in SAMPLE_PAYLOAD.items() if k != "average_completion_time"}
    res_3 = client.post("/predict/workload", json=invalid_3)
    assert res_3.status_code == 422

def test_model_training_and_xgboost_inference():
    """Verify synthetic training generates valid XGBoost artifact and model inference works."""
    model_path = train_and_export_model()
    assert model_path.exists()

    # Reload forecaster
    reloaded = forecaster.load_model()
    assert reloaded is True
    assert forecaster.model_loaded is True

    # Test prediction with trained XGBoost model
    response = client.post("/predict/workload", json=SAMPLE_PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert data["inference_mode"] == "xgboost"
    assert data["predicted_demand"] > 0
    assert data["predicted_inspections"] > 0

