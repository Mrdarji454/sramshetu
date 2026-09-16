import os
from pathlib import Path

# Base Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = BASE_DIR / "app"
ARTIFACTS_DIR = APP_DIR / "ml" / "artifacts"
DATA_DIR = BASE_DIR / "data"

# Ensure directories exist
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "processed").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "raw").mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "ShramSetu AI Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # Model Artifact Configuration
    MODEL_DIR: Path = ARTIFACTS_DIR
    WORKLOAD_MODEL_PATH: Path = ARTIFACTS_DIR / "workload_xgboost.json"
    FEATURE_ENCODER_PATH: Path = ARTIFACTS_DIR / "workload_encoder.json"
    
    # Fallback to intelligent mock/heuristic mode when model artifacts are absent
    ALLOW_MOCK_FALLBACK: bool = True
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
        "*",
    ]

settings = Settings()

