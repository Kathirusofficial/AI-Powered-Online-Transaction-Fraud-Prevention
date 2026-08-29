import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Add ml directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from predict import app

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("TESTING FASTAPI ML PREDICTION SERVICE")
    print("=" * 70)

    # 1. Test GET /health
    print("\n1. Testing GET /health...")
    health_resp = client.get("/health")
    print(f"Status Code: {health_resp.status_code}")
    print(f"Response: {json.dumps(health_resp.json(), indent=2)}")
    assert health_resp.status_code == 200
    assert health_resp.json()["model_loaded"] is True
    assert health_resp.json()["feature_count"] == 20

    # 2. Test POST /predict (Normal / Low-Risk Transaction)
    print("\n2. Testing POST /predict with normal transaction...")
    payload_normal = {
        "amount": 25.50,
        "merchantCategory": "groceries",
        "location": "New York, US",
        "date": "2026-08-23",
        "time": "14:30",
        "accountAge": 45.0,
        "distanceFromPrevious": 3.2,
        "city_pop": 50000.0,
        "gender": "F",
        "type": "Payment",
    }
    pred_resp_1 = client.post("/predict", json=payload_normal)
    print(f"Status Code: {pred_resp_1.status_code}")
    print(f"Response: {json.dumps(pred_resp_1.json(), indent=2)}")
    assert pred_resp_1.status_code == 200
    data1 = pred_resp_1.json()
    assert "fraud_probability" in data1
    assert "risk_score" in data1
    assert "prediction" in data1
    assert "risk_level" in data1
    assert "model_version" in data1

    # 3. Test POST /predict (High-Risk / Fraudulent Pattern)
    print("\n3. Testing POST /predict with high-risk transaction...")
    payload_fraud = {
        "amount": 1850.00,
        "merchantCategory": "shopping_net",
        "location": "Overseas Location",
        "date": "2026-08-23",
        "time": "03:15",
        "accountAge": 22.0,
        "distanceFromPrevious": 1200.0,
        "city_pop": 2500.0,
        "gender": "M",
        "type": "Transfer",
    }
    pred_resp_2 = client.post("/predict", json=payload_fraud)
    print(f"Status Code: {pred_resp_2.status_code}")
    print(f"Response: {json.dumps(pred_resp_2.json(), indent=2)}")
    assert pred_resp_2.status_code == 200
    data2 = pred_resp_2.json()
    assert "fraud_probability" in data2

    # 4. Test Invalid Payload (Amount <= 0)
    print("\n4. Testing POST /predict with invalid input (amount <= 0)...")
    invalid_payload = {
        "amount": -50.0,
        "merchantCategory": "retail",
    }
    invalid_resp = client.post("/predict", json=invalid_payload)
    print(f"Status Code: {invalid_resp.status_code} (Expected 422)")
    assert invalid_resp.status_code == 422

    print("\n" + "=" * 70)
    print("[SUCCESS] All FastAPI ML Prediction Service tests passed cleanly!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
