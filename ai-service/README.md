# ShramSetu AI Service

Python + FastAPI + XGBoost microservice for cooperative labor demand forecasting and fair dispatch optimization (SIH 2026).

---

> [!IMPORTANT]
> **Synthetic Demonstration Data Notice:**
> All training datasets, features, target numbers, and model artifacts in this microservice are **synthetically generated for demonstration, modeling, and software engineering purposes**. They do **NOT** represent real government data, official labor census figures, or confidential worker records.

---

## Phase 12: XGBoost Workload Training Pipeline

Phase 12 delivers an end-to-end Machine Learning pipeline and FastAPI inference service for predicting cooperative labor demand:

### Features and Target Contract
- **Features**:
  - `pending_bookings` (`int`): Number of unassigned bookings awaiting worker dispatch
  - `available_workers` (`int`): Number of cooperative workers currently online and unassigned
  - `avg_completion_time` (`float`): Average job turnaround time in hours
  - `day_of_week` (`str`): Categorical day of the week (`Monday` to `Sunday`)
- **Target**:
  - `actual_demand` (`float`): Realized operational demand volume

### Pipeline Architecture
1. **Synthetic Dataset Generation**: Creates 1,000 labeled records with realistic operational relationships, weekday factors, and variance.
2. **Categorical Preprocessing**: Uses Scikit-Learn's `LabelEncoder` to encode `day_of_week`.
3. **Train/Test Splitting**: 80/20 train-test split (`random_state=42`).
4. **Model Training**: `xgb.XGBRegressor(objective="reg:squarederror")`.
5. **Evaluation**: Evaluated using **Mean Absolute Error (MAE)** and $R^2$.
6. **Serialization**: Model (`xgb_workload_model.joblib`) and encoder (`day_of_week_encoder.joblib`) serialized with `joblib`.
7. **FastAPI Microservice**: Exposes `POST /predict/workload` returning `{ "predictedDemand": <float>, ... }`.

---

## Modular File Structure

| File | Purpose |
| --- | --- |
| `schemas.py` | Pydantic request & response contracts (`WorkloadPredictionRequest`, `WorkloadPredictionResponse`, `HealthResponse`) |
| `train.py` | Synthetic dataset generator (1000 records), `LabelEncoder`, `train_test_split`, `XGBRegressor`, MAE evaluation, and `joblib` export |
| `predictor.py` | Inference class loading `joblib` artifacts with preprocessing and robust fallback |
| `main.py` | FastAPI application exposing `POST /predict/workload`, `GET /health`, and Swagger UI |
| `data/` | Exported demonstration datasets (`synthetic_workload_demand_1000.csv`) |
| `artifacts/` | Serialized model (`xgb_workload_model.joblib`) and encoder (`day_of_week_encoder.joblib`) |
| `tests/test_phase12.py` | Automated tests verifying training, serialization, MAE, schemas, and API responses |

---

## Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model Pipeline
```bash
python train.py
```
Outputs:
- 1,000 synthetic records generated and saved to `data/synthetic_workload_demand_1000.csv`
- Categorical preprocessing with `LabelEncoder`
- MAE and $R^2$ performance metrics
- Serialized artifacts saved to `artifacts/xgb_workload_model.joblib` and `artifacts/day_of_week_encoder.joblib`

### 3. Run FastAPI Predictor
```bash
uvicorn main:app --reload --port 8000
```
Swagger UI available at `http://localhost:8000/docs`.

### 4. Test Prediction Endpoint
```bash
curl -X POST http://localhost:8000/predict/workload \
  -H "Content-Type: application/json" \
  -d '{
    "pending_bookings": 35,
    "available_workers": 12,
    "avg_completion_time": 3.2,
    "day_of_week": "Monday"
  }'
```

**Response (`200 OK`):**
```json
{
  "predictedDemand": 46.52,
  "status": "success",
  "model_version": "1.2.0",
  "disclaimer": "Synthetic demonstration data - not official government records"
}
```

### 5. Run Automated Tests
```bash
pytest tests/test_phase12.py -v
```
