import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"

# Primary External Dataset Location
DOWNLOADS_ARCHIVE_DIR = Path("C:/Users/Administrator/Downloads/archive")

def resolve_dataset_path(filename: str) -> Path:
    """
    Safely resolves the dataset file location, checking:
    1. FRAUD_DATA_DIR environment variable
    2. C:/Users/Administrator/Downloads/archive/
    3. ml/data/ project fallback
    """
    env_dir = os.getenv("FRAUD_DATA_DIR")
    if env_dir and (Path(env_dir) / filename).exists():
        return Path(env_dir) / filename

    archive_path = DOWNLOADS_ARCHIVE_DIR / filename
    if archive_path.exists():
        return archive_path

    local_path = DATA_DIR / filename
    if local_path.exists():
        return local_path

    return archive_path

TRAIN_DATA_PATH = resolve_dataset_path("fraudTrain.csv")
TEST_DATA_PATH = resolve_dataset_path("fraudTest.csv")

MODEL_PATH = MODEL_DIR / "xgboost_fraud_v1.joblib"
PIPELINE_PATH = MODEL_DIR / "feature_pipeline.joblib"
METADATA_PATH = MODEL_DIR / "feature_metadata.json"

# Target & Features Configuration
POSSIBLE_TARGET_COLUMNS = ["is_fraud", "isFraud", "Class", "target", "label", "fraud"]

# Sentinel Application Input Features vs Real Dataset Derived Mappings
REAL_DATASET_FEATURE_MAPPING = {
    "amount": "amt (Numeric)",
    "merchant_category": "category (Categorical - OneHot Encoded)",
    "distance_from_previous": "distance_km (Haversine derived from lat, long, merch_lat, merch_long)",
    "account_age": "customer_age (Years derived from trans_date_trans_time & dob)",
    "trans_hour": "trans_hour (Derived from trans_date_trans_time)",
    "trans_dayofweek": "trans_dayofweek (Derived from trans_date_trans_time)",
    "city_pop": "city_pop (Numeric)",
    "gender": "gender (Categorical - OneHot Encoded)",
}

DOCUMENTED_UNAVAILABLE_FEATURES = [
    "ip_risk_score (No IP risk telemetry in Kaggle credit card dataset - excluded from ML model)",
    "device_type (No device type telemetry in dataset - excluded from ML model)",
    "previous_fraud_count (No historical fraud flag column in dataset - excluded from ML model)",
    "previous_transaction_amount (No sequential previous amount column in dataset - excluded from ML model)",
    "transaction_frequency (No daily frequency column in dataset - excluded from ML model)",
]

# Model Parameters
RANDOM_STATE = 42
MODEL_VERSION = "v1.0.0"
