# Sentinel FraudShield AI — Model Directory

This directory stores serialized model artifacts generated after running model training:
- `xgboost_fraud_v1.pkl`: Trained XGBoost classifier
- `feature_metadata.json`: Feature list and preprocessing metadata

> [!NOTE]
> Trained models will only be saved here after a real dataset (`ml/data/fraud_dataset.csv`) is provided and training is successfully executed via `python ml/train_model.py`.
