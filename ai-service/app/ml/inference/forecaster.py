import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple

from app.core.config import settings
from app.ml.features.engineer import extract_features

logger = logging.getLogger(__name__)

class WorkloadForecaster:
    """
    Inference engine that executes predictions using trained XGBoost models,
    or falls back cleanly to intelligent domain heuristics when artifacts are missing.
    """

    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.load_model()

    def load_model(self) -> bool:
        """
        Attempts to load serialized XGBoost model from artifacts directory.
        """
        model_path = settings.WORKLOAD_MODEL_PATH
        if model_path.exists():
            try:
                import xgboost as xgb
                self.model = xgb.XGBRegressor()
                self.model.load_model(str(model_path))
                self.model_loaded = True
                logger.info(f"Loaded XGBoost model from {model_path}")
                return True
            except Exception as e:
                logger.warning(f"Failed to load XGBoost model from {model_path}: {e}")
                self.model = None
                self.model_loaded = False
        else:
            logger.info(f"Model artifact {model_path} not found. Running in heuristic/mock fallback mode.")
            self.model = None
            self.model_loaded = False
        return False

    def predict(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs forecast pipeline on raw input data.
        Returns predicted_demand, predicted_inspections, workload_level, priority_score, and insights.
        """
        features_df, metrics = extract_features(raw_input)
        
        if self.model_loaded and self.model is not None:
            try:
                preds = self.model.predict(features_df)
                # Multi-target regressor output: [demand, inspections]
                if preds.ndim == 2 and preds.shape[1] >= 2:
                    pred_demand = float(max(0.0, preds[0, 0]))
                    pred_inspections = float(max(0.0, preds[0, 1]))
                else:
                    pred_demand = float(max(0.0, preds[0]))
                    pred_inspections = float(round(pred_demand * 0.22, 1))
                inference_mode = "xgboost"
            except Exception as e:
                logger.warning(f"Error during XGBoost inference ({e}), falling back to heuristic.")
                pred_demand, pred_inspections = self._heuristic_forecast(raw_input, metrics)
                inference_mode = "heuristic_mock"
        else:
            pred_demand, pred_inspections = self._heuristic_forecast(raw_input, metrics)
            inference_mode = "heuristic_mock"

        # Determine Workload Level
        strain = metrics["workload_strain_index"]
        avail_workers = raw_input["available_workers"]
        pending = raw_input["pending_applications"]

        if (avail_workers == 0 and pending > 0) or strain >= 2.0:
            workload_level = "Critical"
        elif strain >= 1.25 or metrics["worker_utilization"] >= 0.85:
            workload_level = "High"
        elif strain >= 0.7 or metrics["worker_utilization"] >= 0.60:
            workload_level = "Moderate"
        else:
            workload_level = "Low"

        # Determine Priority Score (0.0 to 100.0)
        # Factor 1: Strain (0 to 45 pts)
        strain_score = min(45.0, (strain / 2.0) * 45.0)
        # Factor 2: SLA expiring risk (0 to 35 pts)
        sla_score = min(35.0, metrics["sla_risk_ratio"] * 35.0)
        # Factor 3: Application velocity surge (0 to 20 pts)
        vel_score = min(20.0, max(0.0, (metrics["demand_velocity"] - 0.5) * 20.0))
        priority_score = round(min(100.0, max(0.0, strain_score + sla_score + vel_score)), 1)

        # Actionable Recommendation Insight
        district = raw_input["district"]
        trade = raw_input["service_type"]
        if workload_level == "Critical":
            rec = f"Urgent: Capacity deficit in {district} for {trade}. Activate emergency cooperative standby roster immediately."
        elif workload_level == "High":
            rec = f"Elevated demand detected in {district}. Suggest re-routing available guild members from adjacent zones."
        elif workload_level == "Moderate":
            rec = f"Balanced operations in {district}. Standard fair-rotation dispatch recommended."
        else:
            rec = f"Surplus capacity available in {district} for {trade}. Ready for promotional booking allocation."

        insights = {
            **metrics,
            "recommendation": rec,
            "daily_shift_hours_available": round(max(raw_input["available_workers"] * 8.0, 0.0), 1),
            "pending_backlog_hours": round(raw_input["pending_applications"] * raw_input["average_completion_time"], 1),
        }

        return {
            "predicted_demand": round(pred_demand, 1),
            "predicted_inspections": round(pred_inspections, 1),
            "workload_level": workload_level,
            "priority_score": priority_score,
            "model_version": settings.VERSION,
            "inference_mode": inference_mode,
            "insights": insights,
        }

    def _heuristic_forecast(self, raw_input: Dict[str, Any], metrics: Dict[str, float]) -> Tuple[float, float]:
        """
        Intelligent statistical heuristic when training weights are not yet compiled.
        Combines 7-day momentum and monthly base rate with growth velocity.
        """
        app_7 = float(raw_input["applications_last_7_days"])
        app_30 = float(raw_input["applications_last_30_days"])
        weekly_base = max(app_30 / 4.2857, 1.0)
        velocity = metrics["demand_velocity"]

        # Forecast next 7 days demand: 60% recency + 40% monthly smoothed, factored by velocity
        baseline_forecast = (0.65 * app_7) + (0.35 * weekly_base)
        growth_factor = 1.0 + min(0.35, max(-0.25, (velocity - 1.0) * 0.5))
        predicted_demand = max(1.0, baseline_forecast * growth_factor)

        # Statutory inspections: 18% of projected jobs + audit on expiring requests
        expiring = float(raw_input["expiring_requests"])
        predicted_inspections = max(1.0, (predicted_demand * 0.18) + (expiring * 0.4))

        return predicted_demand, predicted_inspections

forecaster = WorkloadForecaster()

