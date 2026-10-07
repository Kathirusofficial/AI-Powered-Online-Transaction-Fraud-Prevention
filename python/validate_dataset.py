import sys
import os
from pathlib import Path

# Add ml directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from config import TRAIN_DATA_PATH, TEST_DATA_PATH, POSSIBLE_TARGET_COLUMNS, REAL_DATASET_FEATURE_MAPPING, DOCUMENTED_UNAVAILABLE_FEATURES
from feature_engineering import RealFraudFeaturePipeline

def inspect_df(name: str, path: Path):
    print("=" * 70)
    print(f"INSPECTING {name}: {path.name}")
    print("=" * 70)

    if not path.exists():
        print(f"[ERROR] Dataset file not found at: {path}")
        sys.exit(1)

    import pandas as pd
    df = pd.read_csv(path)

    rows, cols = df.shape
    print(f"File Path: {path}")
    print(f"Rows: {rows:,}")
    print(f"Columns: {cols}")

    target_col = None
    for col in POSSIBLE_TARGET_COLUMNS:
        if col in df.columns:
            target_col = col
            break

    if not target_col:
        print(f"\n[WARNING] Target fraud column not detected from defaults {POSSIBLE_TARGET_COLUMNS}.")
        sys.exit(1)

    print(f"Target Column: '{target_col}'")
    return df, target_col

def validate_feature_engineering():
    print("=" * 70)
    print("SENTINEL FRAUDSHIELD AI — STEP 8A FEATURE ENGINEERING PIPELINE")
    print("=" * 70)

    train_df, train_target = inspect_df("TRAIN DATASET", TRAIN_DATA_PATH)
    print("\n")
    test_df, test_target = inspect_df("TEST DATASET", TEST_DATA_PATH)

    print("\n" + "=" * 70)
    print("TESTING REAL FRAUD FEATURE ENGINEERING PIPELINE")
    print("=" * 70)

    pipeline = RealFraudFeaturePipeline(target_column=train_target)

    # Use first 50,000 rows to quickly validate feature engineering transformations
    sample_train = train_df.head(50000)
    sample_test = test_df.head(10000)

    X_train, y_train = pipeline.fit_transform(sample_train)
    X_test, y_test = pipeline.transform(sample_test)

    print(f"\nTransformed Training Feature Matrix: {X_train.shape[0]:,} rows, {X_train.shape[1]} features")
    print(f"Transformed Test Feature Matrix:     {X_test.shape[0]:,} rows, {X_test.shape[1]} features")

    # Check exact feature column equality
    if list(X_train.columns) == list(X_test.columns):
        print("\n[SUCCESS] Train and Test feature columns match 100% identically!")
    else:
        print("\n[ERROR] Discrepancy detected between train and test feature columns.")
        sys.exit(1)

    # Test single runtime payload transformation for /detect integration
    test_runtime_payload = {
        "amount": 450.75,
        "merchantCategory": "shopping_net",
        "accountAge": 45,
        "distanceFromPrevious": 12.5,
        "time": "14:30",
    }
    runtime_features = pipeline.transform_runtime_input(test_runtime_payload)
    print(f"Runtime Input Vector Shape for /detect: {runtime_features.shape[0]} row, {runtime_features.shape[1]} features")

    if list(runtime_features.columns) == list(X_train.columns):
        print("[SUCCESS] Runtime input vector matches training schema 100% identically!")

    print("\n" + "=" * 70)
    print("REAL DATASET MAPPING REPORT:")
    print("=" * 70)
    for k, v in REAL_DATASET_FEATURE_MAPPING.items():
        print(f"  - {k} -> {v}")

    print("\nDOCUMENTED UNAVAILABLE FEATURES (EXCLUDED FROM ML MODEL):")
    for unavail in DOCUMENTED_UNAVAILABLE_FEATURES:
        print(f"  - {unavail}")

    print("=" * 70)
    print("\nValidation Status: PASSED (Step 8A feature engineering pipeline verified)")

if __name__ == "__main__":
    validate_feature_engineering()
