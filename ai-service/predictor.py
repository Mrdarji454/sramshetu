"""
ShramSetu AI Service - Predictor Service (Phase 12)

Loads the serialized XGBoost model and LabelEncoder artifacts using joblib,
preprocesses input features, and generates workload demand forecasts.

DISCLAIMER:
Inference utilizes weights trained on synthetic demonstration data. It does not
reflect real government records or official ministry numbers.
"""

import logging
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("shramsetu.predictor")

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_FILE = ARTIFACTS_DIR / "xgb_workload_model.joblib"
ENCODER_FILE = ARTIFACTS_DIR / "day_of_week_encoder.joblib"

DAYS_ORDER = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


class WorkloadPredictor:
    """
    Inference predictor that loads trained XGBoost and LabelEncoder joblib artifacts.
    """

    def __init__(
        self,
        model_path: Path = MODEL_FILE,
        encoder_path: Path = ENCODER_FILE,
    ):
        self.model_path = Path(model_path)
        self.encoder_path = Path(encoder_path)
        self.model = None
        self.encoder = None
        self.model_loaded = False
        self.load_artifacts()

    def load_artifacts(self) -> bool:
        """
        Loads the saved XGBoost regressor and LabelEncoder from disk using joblib.
        """
        if self.model_path.exists() and self.encoder_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                self.encoder = joblib.load(self.encoder_path)
                self.model_loaded = True
                logger.info(f"Successfully loaded model from {self.model_path} and encoder from {self.encoder_path}")
                return True
            except Exception as exc:
                logger.error(f"Error loading model artifacts: {exc}")
                self.model = None
                self.encoder = None
                self.model_loaded = False
                return False
        else:
            logger.warning(
                f"Model or encoder artifact missing ({self.model_path}, {self.encoder_path}). "
                "Predictor will use fallback mode until train.py is executed."
            )
            self.model = None
            self.encoder = None
            self.model_loaded = False
            return False

    def _normalize_day_of_week(self, day_str: str) -> str:
        """
        Normalizes input weekday string (e.g. 'monday' -> 'Monday').
        """
        clean_day = day_str.strip().capitalize()
        for valid_day in DAYS_ORDER:
            if clean_day.lower() == valid_day.lower():
                return valid_day
        # Default fallback to Monday if unrecognized
        logger.warning(f"Unrecognized day '{day_str}', defaulting to 'Monday'")
        return "Monday"

    def predict(
        self,
        pending_bookings: int,
        available_workers: int,
        avg_completion_time: float,
        day_of_week: str,
    ) -> float:
        """
        Executes workload demand prediction.

        Parameters:
          - pending_bookings: int
          - available_workers: int
          - avg_completion_time: float
          - day_of_week: str

        Returns:
          - predictedDemand: float
        """
        normalized_day = self._normalize_day_of_week(day_of_week)

        if self.model_loaded and self.model is not None and self.encoder is not None:
            try:
                # Preprocess day_of_week using the fitted LabelEncoder
                encoded_day = self.encoder.transform([normalized_day])[0]

                # Prepare feature DataFrame matching training columns
                feature_df = pd.DataFrame(
                    [
                        {
                            "pending_bookings": int(pending_bookings),
                            "available_workers": int(available_workers),
                            "avg_completion_time": float(avg_completion_time),
                            "day_of_week": int(encoded_day),
                        }
                    ]
                )

                raw_prediction = self.model.predict(feature_df)
                predicted_val = float(raw_prediction[0])
                return max(0.0, round(predicted_val, 2))
            except Exception as exc:
                logger.error(f"Prediction failed with model, falling back to heuristic: {exc}")
                return self._fallback_prediction(
                    pending_bookings, available_workers, avg_completion_time, normalized_day
                )
        else:
            return self._fallback_prediction(
                pending_bookings, available_workers, avg_completion_time, normalized_day
            )

    def _fallback_prediction(
        self,
        pending_bookings: int,
        available_workers: int,
        avg_completion_time: float,
        day_of_week: str,
    ) -> float:
        """
        Statistical fallback when joblib artifacts are not yet available.
        Uses the same formula as train.py for consistency:
          demand = (0.80 * pending_bookings) + (4.0 * avg_completion_time) - (0.50 * available_workers)
          scaled by day-of-week multiplier.
        """
        factors = {
            "Monday": 1.00,
            "Tuesday": 0.98,
            "Wednesday": 0.95,
            "Thursday": 1.02,
            "Friday": 1.08,
            "Saturday": 1.15,
            "Sunday": 1.12,
        }
        factor = factors.get(day_of_week, 1.0)
        base = (
            (0.80 * pending_bookings)
            + (2.50 * avg_completion_time)
            - (0.30 * available_workers)
            + 2.70
        )
        est = max(5.0, round(base * factor, 2))
        return est


# Global predictor instance
predictor = WorkloadPredictor()

