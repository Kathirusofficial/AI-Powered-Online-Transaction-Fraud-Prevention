import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np
import joblib

# Add ml directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from config import MODEL_PATH, PIPELINE_PATH, METADATA_PATH

def audit_trained_model():
    print("=" * 70)
    print("SENTINEL FRAUDSHIELD AI — STEP 8F MODEL AUDIT & FEATURE IMPORTANCE")
    print("=" * 70)

    if not MODEL_PATH.exists() or not PIPELINE_PATH.exists():
        print("[ERROR] Model or pipeline artifacts missing!")
        sys.exit(1)

    model = joblib.load(MODEL_PATH)
    pipeline = joblib.load(PIPELINE_PATH)

    with open(METADATA_PATH, "r") as f:
        meta = json.load(f)

    feature_names = pipeline.feature_columns
    print(f"Total Model Features: {len(feature_names)}")
    print(f"Features: {feature_names}\n")

    # 1. Feature Importances (Weight & Gain)
    importances = model.feature_importances_
    feat_imp_df = pd.DataFrame({
        "Feature": feature_names,
        "Importance (Gini/Gain)": importances
    }).sort_values(by="Importance (Gini/Gain)", ascending=False)

    print("--- XGBOOST REAL FEATURE IMPORTANCE RANKING ---")
    for idx, row in feat_imp_df.iterrows():
        print(f"  {row['Feature']:<26}: {row['Importance (Gini/Gain)']:.4f}")

    # 2. Test 5 Materially Different Real Inference Cases
    print("\n" + "=" * 70)
    print("TESTING 5 MATERIALLY DIFFERENT REAL INFERENCE CASES")
    print("=" * 70)

    test_cases = [
        {
            "name": "Test 1: Low amount + common category + daytime",
            "payload": {
                "amount": 18.50,
                "merchantCategory": "groceries",
                "location": "Boston, MA",
                "date": "2026-08-23",
                "time": "12:30",
                "accountAge": 45.0,
                "distanceFromPrevious": 2.0,
                "city_pop": 65000.0,
                "gender": "F",
                "type": "Payment"
            }
        },
        {
            "name": "Test 2: Moderate amount + retail + daytime",
            "payload": {
                "amount": 450.00,
                "merchantCategory": "retail",
                "location": "Dallas, TX",
                "date": "2026-08-23",
                "time": "16:00",
                "accountAge": 35.0,
                "distanceFromPrevious": 15.0,
                "city_pop": 120000.0,
                "gender": "M",
                "type": "Payment"
            }
        },
        {
            "name": "Test 3: Higher amount + online shopping + late night (03:30)",
            "payload": {
                "amount": 1200.00,
                "merchantCategory": "shopping_net",
                "location": "Online / Virtual",
                "date": "2026-08-23",
                "time": "03:30",
                "accountAge": 28.0,
                "distanceFromPrevious": 25.0,
                "city_pop": 50000.0,
                "gender": "F",
                "type": "Purchase"
            }
        },
        {
            "name": "Test 4: Large amount ($4,500) + large distance (1,500km) + night",
            "payload": {
                "amount": 4500.00,
                "merchantCategory": "travel",
                "location": "International Hub",
                "date": "2026-08-23",
                "time": "02:15",
                "accountAge": 22.0,
                "distanceFromPrevious": 1500.0,
                "city_pop": 2500.0,
                "gender": "M",
                "type": "Transfer"
            }
        },
        {
            "name": "Test 5: Micro-payment ($4.20) + gas transport + morning",
            "payload": {
                "amount": 4.20,
                "merchantCategory": "gas",
                "location": "Local Gas Station",
                "date": "2026-08-23",
                "time": "08:30",
                "accountAge": 60.0,
                "distanceFromPrevious": 5.0,
                "city_pop": 35000.0,
                "gender": "M",
                "type": "Payment"
            }
        }
    ]

    for tc in test_cases:
        X = pipeline.transform_runtime_input(tc["payload"])
        prob = float(model.predict_proba(X)[0, 1])
        score = min(100, max(0, int(round(prob * 100))))
        pred = "Fraud" if prob >= 0.5 else "Genuine"
        level = "Critical" if score >= 80 else ("High" if score >= 60 else ("Medium" if score >= 30 else "Low"))

        print(f"\n{tc['name']}:")
        print(f"  Inputs: amount=${tc['payload']['amount']}, category={tc['payload']['merchantCategory']}, time={tc['payload']['time']}, dist={tc['payload']['distanceFromPrevious']}km")
        print(f"  -> Fraud Probability: {prob:.4f} ({prob * 100:.2f}%)")
        print(f"  -> Risk Score:        {score}/100")
        print(f"  -> Prediction:        {pred}")
        print(f"  -> Risk Level:         {level}")

if __name__ == "__main__":
    audit_trained_model()
