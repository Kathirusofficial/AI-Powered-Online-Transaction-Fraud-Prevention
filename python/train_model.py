import sys
import os
import time
import json
from pathlib import Path

# Add ml directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from config import (
    TRAIN_DATA_PATH,
    TEST_DATA_PATH,
    MODEL_PATH,
    PIPELINE_PATH,
    METADATA_PATH,
    MODEL_DIR,
    POSSIBLE_TARGET_COLUMNS,
    RANDOM_STATE,
    MODEL_VERSION,
    REAL_DATASET_FEATURE_MAPPING,
    DOCUMENTED_UNAVAILABLE_FEATURES,
)
from feature_engineering import RealFraudFeaturePipeline

def train_and_evaluate():
    print("=" * 70)
    print("SENTINEL FRAUDSHIELD AI — STEP 8B REAL XGBOOST TRAINING PIPELINE")
    print("=" * 70)

    # 1. Verify Dataset Files Existence
    if not TRAIN_DATA_PATH.exists() or not TEST_DATA_PATH.exists():
        print(f"\n[ERROR] Dataset files missing:")
        print(f"  - Train: {TRAIN_DATA_PATH} (Exists: {TRAIN_DATA_PATH.exists()})")
        print(f"  - Test:  {TEST_DATA_PATH} (Exists: {TEST_DATA_PATH.exists()})")
        print("Training cancelled.")
        sys.exit(1)

    print(f"\n[1/6] Loading real historical datasets...")
    print(f"  - Training Data: {TRAIN_DATA_PATH}")
    print(f"  - Testing Data:  {TEST_DATA_PATH}")

    import pandas as pd
    import numpy as np
    import joblib
    from sklearn.metrics import (
        accuracy_score,
        precision_score,
        recall_score,
        f1_score,
        roc_auc_score,
        confusion_matrix,
        classification_report,
    )
    import xgboost as xgb

    load_start = time.time()
    train_df = pd.read_csv(TRAIN_DATA_PATH)
    test_df = pd.read_csv(TEST_DATA_PATH)
    print(f"  Loaded in {time.time() - load_start:.2f}s")
    print(f"  - Raw Training Records: {train_df.shape[0]:,} rows, {train_df.shape[1]} columns")
    print(f"  - Raw Testing Records:  {test_df.shape[0]:,} rows, {test_df.shape[1]} columns")

    # 2. Identify Target Column
    target_col = None
    for col in POSSIBLE_TARGET_COLUMNS:
        if col in train_df.columns:
            target_col = col
            break

    if not target_col:
        print(f"[ERROR] Target column not found in training dataset. Checked: {POSSIBLE_TARGET_COLUMNS}")
        sys.exit(1)

    print(f"\n[2/6] Identified Target Column: '{target_col}'")

    # 3. Feature Engineering Pipeline (Zero Data Leakage)
    print("\n[3/6] Applying RealFraudFeaturePipeline transformations...")
    pipeline = RealFraudFeaturePipeline(target_column=target_col)

    # Fit on training data ONLY
    X_train, y_train = pipeline.fit_transform(train_df)
    # Transform test data using fitted schema ONLY
    X_test, y_test = pipeline.transform(test_df)

    n_features = len(pipeline.feature_columns)
    print(f"  - Extracted Features Count: {n_features}")
    print(f"  - Feature List: {pipeline.feature_columns}")
    print(f"  - Training Matrix: {X_train.shape[0]:,} samples x {X_train.shape[1]} features")
    print(f"  - Testing Matrix:  {X_test.shape[0]:,} samples x {X_test.shape[1]} features")

    # 4. Class Imbalance Calculation
    train_genuine = int((y_train == 0).sum())
    train_fraud = int((y_train == 1).sum())
    test_genuine = int((y_test == 0).sum())
    test_fraud = int((y_test == 1).sum())

    scale_pos_weight = float(train_genuine / max(1, train_fraud))
    print(f"\n[4/6] Class Distribution Analysis:")
    print(f"  - Training Set Genuine (0): {train_genuine:,} ({train_genuine / len(y_train) * 100:.2f}%)")
    print(f"  - Training Set Fraud (1):   {train_fraud:,} ({train_fraud / len(y_train) * 100:.2f}%)")
    print(f"  - Calculated scale_pos_weight: {scale_pos_weight:.2f}")
    print(f"  - Testing Set Genuine (0):  {test_genuine:,} ({test_genuine / len(y_test) * 100:.2f}%)")
    print(f"  - Testing Set Fraud (1):    {test_fraud:,} ({test_fraud / len(y_test) * 100:.2f}%)")

    # 5. Model Training
    print(f"\n[5/6] Training XGBoost Classifier on {X_train.shape[0]:,} real transaction records...")
    model_params = {
        "n_estimators": 100,
        "max_depth": 6,
        "learning_rate": 0.1,
        "scale_pos_weight": scale_pos_weight,
        "tree_method": "hist",
        "n_jobs": -1,
        "random_state": RANDOM_STATE,
        "eval_metric": "logloss",
    }

    model = xgb.XGBClassifier(**model_params)

    train_start = time.time()
    model.fit(X_train, y_train)
    train_duration = time.time() - train_start
    print(f"  Training completed in {train_duration:.2f} seconds.")

    # 6. Evaluation on Unseen Test Dataset
    print(f"\n[6/6] Evaluating model on unseen test dataset ({X_test.shape[0]:,} samples)...")
    eval_start = time.time()
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    eval_duration = time.time() - eval_start

    accuracy = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    tn, fp, fn, tp = cm[0][0], cm[0][1], cm[1][0], cm[1][1]

    print("\n" + "=" * 70)
    print("REAL XGBOOST FRAUD MODEL EVALUATION METRICS (TEST SET)")
    print("=" * 70)
    print(f"  - Accuracy:         {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"  - Precision:        {precision:.4f} ({precision * 100:.2f}%)")
    print(f"  - Recall:           {recall:.4f} ({recall * 100:.2f}%)")
    print(f"  - F1-Score:         {f1:.4f}")
    print(f"  - ROC-AUC Score:    {roc_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"  [TN: {tn:>6,} | FP: {fp:>6,}]")
    print(f"  [FN: {fn:>6,} | TP: {tp:>6,}]")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Genuine", "Fraud"], digits=4))

    # 7. Save Model & Metadata Artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Saving model artifacts to {MODEL_DIR}...")
    joblib.dump(model, MODEL_PATH)
    joblib.dump(pipeline, PIPELINE_PATH)

    metadata = {
        "model_version": MODEL_VERSION,
        "algorithm": "XGBoost Classifier",
        "target_column": target_col,
        "train_dataset_path": str(TRAIN_DATA_PATH),
        "test_dataset_path": str(TEST_DATA_PATH),
        "training_samples": int(X_train.shape[0]),
        "testing_samples": int(X_test.shape[0]),
        "training_genuine": train_genuine,
        "training_fraud": train_fraud,
        "testing_genuine": test_genuine,
        "testing_fraud": test_fraud,
        "scale_pos_weight": scale_pos_weight,
        "feature_count": n_features,
        "feature_columns": pipeline.feature_columns,
        "categorical_features": pipeline.categorical_features,
        "categories_map": pipeline.categories_map,
        "hyperparameters": {
            "n_estimators": model_params["n_estimators"],
            "max_depth": model_params["max_depth"],
            "learning_rate": model_params["learning_rate"],
            "scale_pos_weight": model_params["scale_pos_weight"],
            "tree_method": model_params["tree_method"],
            "random_state": model_params["random_state"],
            "eval_metric": model_params["eval_metric"],
        },
        "training_duration_seconds": round(train_duration, 2),
        "evaluation_duration_seconds": round(eval_duration, 2),
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "confusion_matrix": {
                "true_negative": tn,
                "false_positive": fp,
                "false_negative": fn,
                "true_positive": tp,
            },
        },
        "dataset_feature_mapping": REAL_DATASET_FEATURE_MAPPING,
        "documented_unavailable_features": DOCUMENTED_UNAVAILABLE_FEATURES,
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n[SUCCESS] Artifacts successfully serialized:")
    print(f"  - Model File:    {MODEL_PATH} ({os.path.getsize(MODEL_PATH):,} bytes)")
    print(f"  - Pipeline File: {PIPELINE_PATH} ({os.path.getsize(PIPELINE_PATH):,} bytes)")
    print(f"  - Metadata File: {METADATA_PATH} ({os.path.getsize(METADATA_PATH):,} bytes)")
    print("=" * 70)
    print("STEP 8B COMPLETE — MODEL TRAINING SUCCEEDED WITH REAL METRICS")
    print("=" * 70)

if __name__ == "__main__":
    train_and_evaluate()
