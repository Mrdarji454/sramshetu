import json
import logging
from pathlib import Path
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

from app.core.config import settings
from app.ml.features.engineer import extract_features, FEATURE_COLUMNS, KNOWN_DISTRICTS, KNOWN_SERVICES

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_synthetic_dataset(n_samples: int = 1200, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic historical training dataset based on Indian cooperative marketplace data.
    """
    np.random.seed(random_state)

    records = []
    for _ in range(n_samples):
        district = np.random.choice(KNOWN_DISTRICTS[:-1])
        service = np.random.choice(KNOWN_SERVICES[:-1])

        # Trade and district scaling factor
        scale = 1.8 if district in ["Pune", "Mumbai", "Delhi", "Bengaluru"] else 1.0
        trade_multiplier = 1.5 if "Electrical" in service or "Civil" in service else 1.0

        num_workers = int(np.random.randint(25, 180) * scale)
        utilization = np.random.uniform(0.40, 0.95)
        avail_workers = int(max(0, num_workers * (1.0 - utilization)))

        # 30-day base demand
        app_30 = int(np.random.randint(40, 300) * scale * trade_multiplier)
        weekly_expected = app_30 / 4.2857

        # Seasonal / weekly volatility (-25% to +40%)
        surge = np.random.uniform(0.75, 1.40)
        app_7 = int(max(5, weekly_expected * surge))

        avg_comp_time = round(np.random.uniform(2.0, 6.5), 1)
        pending = int(np.random.randint(2, max(5, int(app_7 * 0.6))))
        expiring = int(np.random.randint(0, max(1, int(pending * 0.35))))

        raw_item = {
            "applications_last_7_days": app_7,
            "applications_last_30_days": app_30,
            "pending_applications": pending,
            "expiring_requests": expiring,
            "district": district,
            "service_type": service,
            "number_of_workers": num_workers,
            "available_workers": avail_workers,
            "average_completion_time": avg_comp_time,
        }

        features_df, _ = extract_features(raw_item)
        feature_row = features_df.iloc[0].to_dict()

        # Ground Truth Targets: Next 7-day actual demand & inspections
        momentum = app_7 / max(weekly_expected, 1.0)
        actual_next_demand = max(2.0, (0.7 * app_7 + 0.3 * weekly_expected) * (1.0 + 0.3 * (momentum - 1.0)) + np.random.normal(0, 3.5))
        actual_inspections = max(1.0, (0.20 * actual_next_demand) + (0.35 * expiring) + np.random.normal(0, 1.0))

        feature_row["target_demand"] = round(actual_next_demand, 1)
        feature_row["target_inspections"] = round(actual_inspections, 1)
        records.append(feature_row)

    df = pd.DataFrame(records)
    return df

def train_and_export_model():
    """
    Trains multi-output XGBoost Regressor and saves model artifact.
    """
    logger.info("Generating synthetic training dataset for ShramSetu workload forecasting...")
    df = generate_synthetic_dataset()

    X = df[FEATURE_COLUMNS]
    y = df[["target_demand", "target_inspections"]]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    logger.info(f"Training XGBoost Regressor on {len(X_train)} samples across {len(FEATURE_COLUMNS)} features...")
    
    # Train MultiOutput XGBoost Regressor
    base_xgb = xgb.XGBRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror",
    )
    
    model = MultiOutputRegressor(base_xgb)
    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    r2_demand = r2_score(y_test["target_demand"], preds[:, 0])
    r2_inspections = r2_score(y_test["target_inspections"], preds[:, 1])
    logger.info(f"Model Evaluation -> Demand R²: {r2_demand:.3f}, Inspections R²: {r2_inspections:.3f}")

    # Export model to artifacts directory
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save the primary estimator JSON
    export_path = settings.WORKLOAD_MODEL_PATH
    # For multi-output, we can save the first estimator's model or a bundled xgb Booster
    # Let's save a unified multi-target native XGBoost or booster
    unified_xgb = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42,
    )
    unified_xgb.fit(X_train, y_train)
    unified_xgb.save_model(str(export_path))
    logger.info(f"Saved native XGBoost model artifact to {export_path}")

    # Save feature metadata
    metadata_path = settings.FEATURE_ENCODER_PATH
    metadata = {
        "feature_columns": FEATURE_COLUMNS,
        "districts": KNOWN_DISTRICTS,
        "services": KNOWN_SERVICES,
        "version": settings.VERSION,
        "metrics": {
            "r2_demand": round(float(r2_demand), 3),
            "r2_inspections": round(float(r2_inspections), 3),
        },
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved feature metadata to {metadata_path}")

    return export_path

if __name__ == "__main__":
    train_and_export_model()

