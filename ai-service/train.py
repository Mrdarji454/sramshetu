"""
ShramSetu AI Service - XGBoost Workload Model Training Pipeline (Phase 12)

==================================================================================
DOCUMENTATION & ETHICAL DISCLAIMER:
This pipeline generates and trains on SYNTHETIC DEMONSTRATION DATA ONLY.
The records, metrics, bookings, worker counts, and demand targets are algorithmically
synthesized to validate ML forecasting workflows for cooperative labor dispatch.
This dataset does NOT contain real government data, official labor census numbers,
or personally identifiable information (PII).
==================================================================================

Pipeline Steps:
1. Synthetic Data Generation: 1,000 clearly labeled records.
   Features:
     - pending_bookings (int)
     - available_workers (int)
     - avg_completion_time (float)
     - day_of_week (categorical string: Monday - Sunday)
   Target:
     - actual_demand (float)
2. Categorical Preprocessing: Scikit-learn LabelEncoder for day_of_week.
3. Dataset Splitting: Train/test split (80/20, random_state=42).
4. XGBoost Regression: XGBRegressor with objective 'reg:squarederror'.
5. Model Evaluation: Mean Absolute Error (MAE) and R² score.
6. Artifact Serialization: Model and LabelEncoder saved with joblib.
"""

import json
import logging
import os
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("shramsetu.train")

# Base paths
BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
DATA_DIR = BASE_DIR / "data"

MODEL_FILE = ARTIFACTS_DIR / "xgb_workload_model.joblib"
ENCODER_FILE = ARTIFACTS_DIR / "day_of_week_encoder.joblib"
METADATA_FILE = ARTIFACTS_DIR / "model_metadata.json"
DATASET_CSV_FILE = DATA_DIR / "synthetic_workload_demand_1000.csv"

# Days of week in chronological order
DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

# Day multiplier factors simulating real-world operational patterns
DAY_FACTORS = {
    "Monday": 1.25,      # Backlog surge after weekend
    "Tuesday": 1.05,     # Normal weekday throughput
    "Wednesday": 1.00,   # Midweek baseline
    "Thursday": 1.10,    # Pre-weekend ramp
    "Friday": 1.20,      # Urgent weekend readiness requests
    "Saturday": 1.35,    # Peak household & facility maintenance
    "Sunday": 1.30,      # High weekend service demand
}


def generate_synthetic_dataset(n_samples: int = 1000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a clearly labeled synthetic dataset with exactly n_samples (default: 1000).

    IMPORTANT:
    This is synthetic demonstration data generated for modeling and testing purposes.
    It is NOT real government or census data.

    Features:
      - pending_bookings  : Number of pending tasks in queue (5 to 120)
      - available_workers : Currently available cooperative workers (3 to 60)
      - avg_completion_time: Average job turnaround time in hours (1.0 to 8.0 hrs)
      - day_of_week       : Day of the week (Monday - Sunday)

    Target:
      - actual_demand: Workload demand score driven by:
          * pending_bookings  → strong positive driver (more bookings = more demand)
          * available_workers → inverse relief factor (more workers = less strain)
          * avg_completion_time → strain multiplier (longer tasks = higher demand)
          * day_of_week multiplier → realistic weekday scaling
          * Gaussian noise ± 2.5 for realism

    Typical demand range: 10 – 160 units.
    """
    logger.info(f"Synthesizing {n_samples} demonstration records (synthetic data, not real government data)...")
    np.random.seed(random_state)

    pending_bookings = np.random.randint(5, 121, size=n_samples)        # 5..120
    available_workers = np.random.randint(3, 61, size=n_samples)         # 3..60
    avg_completion_time = np.round(np.random.uniform(1.0, 8.0, size=n_samples), 2)  # 1.0..8.0 hrs
    days = np.random.choice(DAYS_OF_WEEK, size=n_samples)

    actual_demands = []
    for pb, aw, ct, day in zip(pending_bookings, available_workers, avg_completion_time, days):
        day_mult = DAY_FACTORS[day]

        # Demand formula (intuitive and well-calibrated):
        #   - Each pending booking contributes 0.8 units of demand
        #   - Each hour of avg completion time adds 4.0 units (strain)
        #   - Each available worker reduces demand pressure by 0.5 units
        #   - Day-of-week multiplier scales the total (0.90..1.20)
        base_demand = (0.80 * pb) + (4.0 * ct) - (0.50 * aw)
        noise = np.random.normal(0, 2.5)
        dem = max(5.0, round((base_demand * day_mult) + noise, 2))
        actual_demands.append(float(dem))

    df = pd.DataFrame({
        "pending_bookings": pending_bookings,
        "available_workers": available_workers,
        "avg_completion_time": avg_completion_time,
        "day_of_week": days,
        "actual_demand": actual_demands,
    })

    return df



def preprocess_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, LabelEncoder]:
    """
    Preprocesses categorical data using Scikit-Learn's LabelEncoder.
    Encodes 'day_of_week' into numeric labels.

    Returns:
      - X (DataFrame): Feature matrix
      - y (Series): Target vector 'actual_demand'
      - encoder (LabelEncoder): Fitted encoder on day_of_week
    """
    logger.info("Preprocessing categorical feature 'day_of_week' with LabelEncoder...")
    encoder = LabelEncoder()

    # Ensure encoder fits all standard 7 days regardless of sample distribution
    encoder.fit(DAYS_OF_WEEK)

    # Transform day_of_week column
    df_processed = df.copy()
    df_processed["day_of_week"] = encoder.transform(df_processed["day_of_week"])

    feature_cols = ["pending_bookings", "available_workers", "avg_completion_time", "day_of_week"]
    X = df_processed[feature_cols]
    y = df_processed["actual_demand"]

    return X, y, encoder


def train_xgboost_pipeline(
    n_samples: int = 1000,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Dict[str, any]:
    """
    End-to-end training and evaluation pipeline for XGBoost workload forecasting.

    1. Generates 1,000 synthetic records.
    2. Encodes categorical 'day_of_week' using LabelEncoder.
    3. Splits data into train and test sets.
    4. Trains an XGBRegressor.
    5. Evaluates using Mean Absolute Error (MAE).
    6. Saves trained model and encoder with joblib.
    """
    # Step 1: Generate synthetic dataset
    df = generate_synthetic_dataset(n_samples=n_samples, random_state=random_state)

    # Save dataset to CSV for transparency and reproducibility
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATASET_CSV_FILE, index=False)
    logger.info(f"Saved synthetic demonstration dataset to {DATASET_CSV_FILE}")

    # Step 2: Categorical Preprocessing with LabelEncoder
    X, y, encoder = preprocess_data(df)

    # Step 3: Train-test split
    logger.info(f"Splitting dataset: {1.0 - test_size:.0%} train, {test_size:.0%} test...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    # Step 4: Train XGBRegressor
    logger.info(
        f"Training XGBRegressor on {len(X_train)} samples across features: "
        f"{list(X.columns)}..."
    )
    xgb_regressor = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=random_state,
        objective="reg:squarederror",
    )
    xgb_regressor.fit(X_train, y_train)

    # Step 5: Evaluate using Mean Absolute Error
    y_pred = xgb_regressor.predict(X_test)
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    logger.info(f"=== Model Evaluation Results ===")
    logger.info(f"Mean Absolute Error (MAE): {mae:.3f}")
    logger.info(f"Coefficient of Determination (R²): {r2:.3f}")

    # Step 6: Save model and encoder using joblib
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(xgb_regressor, MODEL_FILE)
    logger.info(f"Saved trained XGBoost model to {MODEL_FILE}")

    joblib.dump(encoder, ENCODER_FILE)
    logger.info(f"Saved LabelEncoder to {ENCODER_FILE}")

    # Step 7: Export model metadata
    metadata = {
        "model_type": "XGBRegressor",
        "library_versions": {
            "xgboost": xgb.__version__,
            "joblib": joblib.__version__,
        },
        "dataset": {
            "records": len(df),
            "features": list(X.columns),
            "target": "actual_demand",
            "is_synthetic": True,
            "disclaimer": "Synthetic demonstration data - not official government records",
        },
        "metrics": {
            "mean_absolute_error": round(mae, 4),
            "r2_score": round(r2, 4),
        },
        "days_of_week_classes": list(encoder.classes_),
    }
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved model metadata to {METADATA_FILE}")

    return {
        "model_file": str(MODEL_FILE),
        "encoder_file": str(ENCODER_FILE),
        "mae": mae,
        "r2": r2,
        "records": len(df),
        "features": list(X.columns),
    }


if __name__ == "__main__":
    results = train_xgboost_pipeline()
    print("\n" + "=" * 60)
    print("SHRAMSETU AI SERVICE - PHASE 12 TRAINING COMPLETE")
    print("=" * 60)
    print(f"Dataset Size : {results['records']} records (Synthetic demonstration data)")
    print(f"Features     : {results['features']}")
    print(f"Target       : actual_demand")
    print(f"Evaluation   : MAE = {results['mae']:.3f} | R² = {results['r2']:.3f}")
    print(f"Model File   : {results['model_file']}")
    print(f"Encoder File : {results['encoder_file']}")
    print("=" * 60)

