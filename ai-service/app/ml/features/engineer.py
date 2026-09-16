import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Known categories for encoding consistency
KNOWN_DISTRICTS = [
    "Pune", "Mumbai", "Delhi", "Bengaluru", "Chennai", "Jaipur", "Ahmedabad", "Ludhiana", "Patna", "Other"
]

KNOWN_SERVICES = [
    "Electrical & Power Systems",
    "Plumbing & Water Sanitation",
    "Civil Construction & Masonry",
    "Carpentry & Woodwork",
    "Welding & Metal Fabrication",
    "Heavy Logistics & Rigging",
    "Painting & Surface Coating",
    "Agro Operations & Machinery",
    "Other"
]

FEATURE_COLUMNS = [
    "applications_last_7_days",
    "applications_last_30_days",
    "pending_applications",
    "expiring_requests",
    "number_of_workers",
    "available_workers",
    "average_completion_time",
    "application_velocity",
    "backlog_ratio",
    "worker_utilization",
    "workload_strain_index",
    "sla_risk_ratio",
    "district_encoded",
    "service_encoded",
]

def encode_categorical(value: str, known_list: list[str]) -> int:
    for idx, item in enumerate(known_list):
        if item.lower() in value.lower():
            return idx
    return len(known_list) - 1

def extract_features(raw_data: Dict[str, Any]) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """
    Transforms raw input dictionary into an ML-ready feature DataFrame and derived telemetry metrics.
    """
    app_7 = float(raw_data["applications_last_7_days"])
    app_30 = float(raw_data["applications_last_30_days"])
    pending = float(raw_data["pending_applications"])
    expiring = float(raw_data["expiring_requests"])
    num_workers = float(max(raw_data["number_of_workers"], 1))
    avail_workers = float(raw_data["available_workers"])
    comp_time = float(raw_data["average_completion_time"])
    
    # Derived Signals
    weekly_baseline = max(app_30 / 4.2857, 1.0)
    app_velocity = round(app_7 / weekly_baseline, 3)
    backlog_ratio = round(pending / max(app_7, 1.0), 3)
    worker_utilization = round(max(0.0, min(1.0, 1.0 - (avail_workers / num_workers))), 3)
    
    # 8-hour shift capacity of currently available workers
    daily_available_hours = max(avail_workers * 8.0, 1.0)
    workload_hours_backlog = pending * comp_time
    workload_strain_index = round(workload_hours_backlog / daily_available_hours, 3)
    
    sla_risk_ratio = round(expiring / max(pending, 1.0), 3)
    
    district_enc = encode_categorical(raw_data["district"], KNOWN_DISTRICTS)
    service_enc = encode_categorical(raw_data["service_type"], KNOWN_SERVICES)
    
    feature_dict = {
        "applications_last_7_days": app_7,
        "applications_last_30_days": app_30,
        "pending_applications": pending,
        "expiring_requests": expiring,
        "number_of_workers": num_workers,
        "available_workers": avail_workers,
        "average_completion_time": comp_time,
        "application_velocity": app_velocity,
        "backlog_ratio": backlog_ratio,
        "worker_utilization": worker_utilization,
        "workload_strain_index": workload_strain_index,
        "sla_risk_ratio": sla_risk_ratio,
        "district_encoded": float(district_enc),
        "service_encoded": float(service_enc),
    }
    
    df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
    
    metrics = {
        "worker_utilization": worker_utilization,
        "workload_strain_index": workload_strain_index,
        "demand_velocity": app_velocity,
        "sla_risk_ratio": sla_risk_ratio,
    }
    
    return df, metrics

