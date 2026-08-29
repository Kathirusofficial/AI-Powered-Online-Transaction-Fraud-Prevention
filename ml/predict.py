import os
import sys
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import numpy as np

# Add ml directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from config import MODEL_PATH, PIPELINE_PATH, METADATA_PATH, MODEL_VERSION
from feature_engineering import RealFraudFeaturePipeline

# Initialize FastAPI App
app = FastAPI(
    title="Sentinel FraudShield AI — ML Prediction Service",
    description="Real-time XGBoost ML fraud detection inference API with feature explainability",
    version=MODEL_VERSION,
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
ml_model = None
feature_pipeline = None
model_metadata = {}
global_feature_importance: List[Dict[str, Any]] = []

FEATURE_LABELS = {
    "amt": "Transaction Amount",
    "distance_km": "Geographic Distance",
    "customer_age": "Customer Age",
    "trans_hour": "Transaction Hour",
    "trans_dayofweek": "Day of Week",
    "city_pop": "City Population",
    "category_gas_transport": "Gas & Transport Category",
    "category_grocery_net": "Online Grocery Category",
    "category_food_dining": "Food & Dining Category",
    "category_home": "Home Category",
    "category_grocery_pos": "Physical Grocery Category",
    "category_shopping_net": "Online Shopping Category",
    "category_travel": "Travel Category",
    "category_misc_pos": "Physical Retail / Misc",
    "category_shopping_pos": "Physical Shopping Category",
    "category_kids_pets": "Kids & Pets Category",
    "category_personal_care": "Personal Care Category",
    "category_misc_net": "Online Misc Category",
    "category_health_fitness": "Health & Fitness Category",
    "gender_M": "Cardholder Gender (Male)",
}

def load_artifacts():
    global ml_model, feature_pipeline, model_metadata, global_feature_importance

    if not MODEL_PATH.exists() or not PIPELINE_PATH.exists():
        raise RuntimeError(f"ML model artifacts missing: {MODEL_PATH} or {PIPELINE_PATH}")

    ml_model = joblib.load(MODEL_PATH)
    feature_pipeline = joblib.load(PIPELINE_PATH)

    if METADATA_PATH.exists():
        with open(METADATA_PATH, "r") as f:
            model_metadata = json.load(f)

    # Compute global feature importance ranking from trained XGBoost model
    feature_names = feature_pipeline.feature_columns
    importances = ml_model.feature_importances_

    global_feature_importance = [
        {
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "importance": round(float(imp), 4),
        }
        for feat, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    ]

# Load artifacts on startup
try:
    load_artifacts()
    print(f"[SUCCESS] ML model and feature pipeline loaded successfully. Version: {MODEL_VERSION}")
except Exception as e:
    print(f"[WARNING] ML artifacts could not be loaded on startup: {e}")

# Request and Response Pydantic Schemas
class TransactionPayload(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction monetary amount (must be > 0)")
    merchantCategory: Optional[str] = Field(default="shopping_net", description="Merchant category string")
    location: Optional[str] = Field(default="", description="Transaction location or city")
    date: Optional[str] = Field(default="", description="Transaction date (YYYY-MM-DD)")
    time: Optional[str] = Field(default="12:00", description="Transaction time (HH:MM)")
    accountAge: Optional[float] = Field(default=35.0, description="Customer / Account age in years or days")
    distanceFromPrevious: Optional[float] = Field(default=0.0, description="Distance from previous activity in km")
    city_pop: Optional[float] = Field(default=50000.0, description="City population metric")
    gender: Optional[str] = Field(default="M", description="Cardholder gender ('M' or 'F')")
    type: Optional[str] = Field(default="Payment", description="Transaction type")
    deviceType: Optional[str] = Field(default="Mobile", description="Device type")
    ipRiskScore: Optional[int] = Field(default=20, description="IP risk score")

class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float
    value: Optional[Any] = None

class PredictionExplanation(BaseModel):
    summary: str
    evaluated_factors: List[str]
    model_feature_importance: List[FeatureImportanceItem]

class PredictionResponse(BaseModel):
    fraud_probability: float
    risk_score: int
    prediction: str
    risk_level: str
    model_version: str
    feature_count: int
    explanation: Optional[PredictionExplanation] = None

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    feature_count: int
    algorithm: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint verifying model state and feature configuration.
    """
    is_loaded = ml_model is not None and feature_pipeline is not None
    feature_count = len(feature_pipeline.feature_columns) if feature_pipeline else 0
    algorithm = model_metadata.get("algorithm", "XGBoost Classifier")

    if not is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model artifacts are unavailable",
        )

    return HealthResponse(
        status="ok",
        model_loaded=True,
        model_version=MODEL_VERSION,
        feature_count=feature_count,
        algorithm=algorithm,
    )

@app.post("/predict", response_model=PredictionResponse)
def predict_transaction(payload: TransactionPayload):
    """
    Inference endpoint running trained XGBoost model on the 20-feature schema with honest feature explainability.
    """
    if ml_model is None or feature_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model artifacts are unavailable",
        )

    try:
        input_data = payload.model_dump()
        
        # Transform input into exact 20-feature DataFrame
        X = feature_pipeline.transform_runtime_input(input_data)

        # Run real model probability prediction
        probabilities = ml_model.predict_proba(X)
        prob_fraud = float(probabilities[0, 1])

        # Derive risk score and classification
        fraud_probability = round(prob_fraud, 4)
        risk_score = min(100, max(0, int(round(fraud_probability * 100))))
        prediction = "Fraud" if fraud_probability >= 0.5 else "Genuine"

        if risk_score >= 80:
            risk_level = "Critical"
        elif risk_score >= 60:
            risk_level = "High"
        elif risk_score >= 30:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Formulate honest explanation based exclusively on supported model features
        evaluated_factors = []
        amt = float(input_data.get("amount", 0))
        dist = float(input_data.get("distanceFromPrevious", 0))
        time_str = str(input_data.get("time", "12:00"))
        try:
            hour = int(time_str.split(":")[0])
        except Exception:
            hour = 12

        cat = str(input_data.get("merchantCategory", "shopping_net")).lower()

        if amt > 3000:
            evaluated_factors.append(f"High transaction amount (${amt:,.2f}) evaluated against fraud baselines")
        elif amt > 1000:
            evaluated_factors.append(f"Elevated transaction amount (${amt:,.2f})")
        elif amt < 50:
            evaluated_factors.append(f"Low transaction amount (${amt:,.2f}) consistent with ordinary purchasing")

        if hour >= 0 and hour <= 5:
            evaluated_factors.append(f"Late-night transaction window ({hour:02d}:00) evaluated for temporal risk")
        else:
            evaluated_factors.append(f"Standard daytime transaction hour ({hour:02d}:00)")

        if dist > 500:
            evaluated_factors.append(f"High geographic displacement ({dist:,.1f} km from previous activity)")
        else:
            evaluated_factors.append(f"Local transaction vicinity ({dist:,.1f} km)")

        evaluated_factors.append(f"Merchant category '{cat}' evaluated by trained XGBoost decision trees")

        if risk_score >= 60:
            summary = "The transaction was flagged with elevated risk based on patterns learned from real credit card fraud data."
        elif risk_score >= 30:
            summary = "The transaction exhibits moderate statistical risk across learned behavioral decision trees."
        else:
            summary = "The transaction aligns with normal, genuine credit card purchasing behavior."

        # Top 5 model feature importances with user-supplied values
        top_features = []
        for item in global_feature_importance[:5]:
            feat_name = item["feature"]
            val = X[feat_name].iloc[0] if feat_name in X.columns else None
            top_features.append(
                FeatureImportanceItem(
                    feature=feat_name,
                    label=item["label"],
                    importance=item["importance"],
                    value=float(val) if val is not None else None,
                )
            )

        explanation = PredictionExplanation(
            summary=summary,
            evaluated_factors=evaluated_factors,
            model_feature_importance=top_features,
        )

        return PredictionResponse(
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            prediction=prediction,
            risk_level=risk_level,
            model_version=MODEL_VERSION,
            feature_count=len(feature_pipeline.feature_columns),
            explanation=explanation,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inference processing error: {str(e)}",
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("predict:app", host="0.0.0.0", port=8000, reload=False)
