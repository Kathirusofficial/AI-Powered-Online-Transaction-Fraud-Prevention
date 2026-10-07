# Sentinel FraudShield AI — Dataset Integration Guide

## Expected Dataset Requirements

To train a real supervised machine learning model for fraud detection, place your historical transaction dataset at:
`ml/data/fraud_dataset.csv`

> [!IMPORTANT]
> **SYNTHETIC & FAKE DATA POLICY**
> Synthetic data, randomly generated datasets, or faked labels are **STRICTLY PROHIBITED**. 
> Only authentic public or enterprise fraud datasets may be used (e.g. Kaggle Credit Card Fraud Dataset, IEEE-CIS Fraud Detection Dataset).

## Expected Schema & Structure

1. **Format:** CSV (`ml/data/fraud_dataset.csv`)
2. **Target / Label Column:** A binary target column indicating fraud (e.g., `Class`, `is_fraud`, or `isFraud` where `1` = Fraud, `0` = Genuine).
3. **Recommended Application Input Features:**
   - `amount` (Transaction amount, numeric)
   - `account_age` (Account age in days, numeric)
   - `transaction_frequency` (Transactions per day, numeric)
   - `previous_transaction_amount` (Numeric)
   - `previous_fraud_count` (Numeric count of past flags)
   - `distance_from_previous` (Distance in km, numeric)
   - `ip_risk_score` (IP reputation score 0-100, numeric)
   - `merchant_category` (String / Categorical)
   - `device_type` (String / Categorical: Mobile, Desktop, Tablet, etc.)

## How to Validate the Dataset

Before running model training, execute the validation script:
```bash
python ml/validate_dataset.py
```

This script will verify:
- Dataset existence and file integrity
- Missing value ratios
- Data types and duplicate rows
- Class distribution & imbalance ratio
- Match percentage between dataset columns and application features

## How to Run Model Training

Once validated, execute:
```bash
python ml/train_model.py
```
If `ml/data/fraud_dataset.csv` is missing, training will automatically cancel cleanly.
