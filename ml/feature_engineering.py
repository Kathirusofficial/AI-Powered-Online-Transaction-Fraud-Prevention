import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any

def haversine_distance(lat1: pd.Series, lon1: pd.Series, lat2: pd.Series, lon2: pd.Series) -> pd.Series:
    """
    Computes real Haversine distance in kilometers between transaction location and merchant location.
    """
    R = 6371.0  # Earth's radius in kilometers
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2.0) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0) ** 2
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return R * c

class RealFraudFeaturePipeline:
    """
    Feature engineering pipeline for real Kaggle fraud dataset (fraudTrain.csv / fraudTest.csv).
    Derives realistic features without synthetic or fake data generation.
    """

    def __init__(self, target_column: str = "is_fraud"):
        self.target_column = target_column
        self.feature_columns: List[str] = []
        self.categorical_features = ["category", "gender"]
        self.categories_map: Dict[str, List[str]] = {}

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts derived numeric and categorical features from raw dataset columns.
        """
        features_df = pd.DataFrame(index=df.index)

        # 1. Transaction Amount
        features_df["amt"] = df["amt"].astype(float)

        # 2. Haversine Distance (km)
        features_df["distance_km"] = haversine_distance(df["lat"], df["long"], df["merch_lat"], df["merch_long"])

        # 3. Date & Time Transformations
        trans_dt = pd.to_datetime(df["trans_date_trans_time"])
        dob_dt = pd.to_datetime(df["dob"])

        features_df["customer_age"] = ((trans_dt - dob_dt).dt.days / 365.25).astype(float)
        features_df["trans_hour"] = trans_dt.dt.hour.astype(int)
        features_df["trans_dayofweek"] = trans_dt.dt.dayofweek.astype(int)

        # 4. City Population
        features_df["city_pop"] = df["city_pop"].astype(float)

        # 5. Categoricals
        features_df["category"] = df["category"].astype(str)
        features_df["gender"] = df["gender"].astype(str)

        return features_df

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Extracts features, fits One-Hot encoding schema, and returns feature matrix X and target y.
        """
        X_raw = self.extract_features(df)
        y = df[self.target_column].astype(int) if self.target_column in df.columns else None

        # Store categorical levels for deterministic encoding alignment
        for col in self.categorical_features:
            self.categories_map[col] = sorted(X_raw[col].unique().tolist())

        # One-Hot Encode categoricals
        X = pd.get_dummies(X_raw, columns=self.categorical_features, drop_first=True)
        self.feature_columns = list(X.columns)

        return X, y

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Transforms test/validation dataset using the fitted encoding schema.
        """
        X_raw = self.extract_features(df)
        y = df[self.target_column].astype(int) if self.target_column in df.columns else None

        X = pd.get_dummies(X_raw, columns=self.categorical_features, drop_first=True)

        # Align columns with fit_transform schema
        for col in self.feature_columns:
            if col not in X.columns:
                X[col] = 0

        X = X[self.feature_columns]
        return X, y

    def transform_runtime_input(self, input_dict: Dict[str, Any]) -> pd.DataFrame:
        """
        Maps a runtime transaction payload into the exact 20-feature model schema.
        """
        amt = float(input_dict.get("amount", 0.0))
        
        # Normalize category
        cat_raw = str(input_dict.get("merchantCategory", "shopping_net")).strip().lower()
        cat_map = {
            "retail": "shopping_pos",
            "online": "shopping_net",
            "food & dining": "food_dining",
            "entertainment": "entertainment",
            "travel": "travel",
            "electronics": "shopping_net",
            "groceries": "grocery_pos",
            "healthcare": "personal_care",
            "gas": "gas_transport",
            "other": "misc_pos",
        }
        category = cat_map.get(cat_raw, cat_raw.replace(" & ", "_").replace(" ", "_"))

        customer_age = float(input_dict.get("accountAge", 35.0))
        distance_km = float(input_dict.get("distanceFromPrevious", 0.0))

        # Time parsing
        time_str = str(input_dict.get("time", "12:00"))
        try:
            hour = int(time_str.split(":")[0])
        except Exception:
            hour = 12

        date_str = str(input_dict.get("date", ""))
        dayofweek = 0
        if date_str:
            try:
                dayofweek = int(pd.to_datetime(date_str).dayofweek)
            except Exception:
                dayofweek = 0

        city_pop = float(input_dict.get("city_pop", 50000.0))
        gender = str(input_dict.get("gender", "M")).upper()
        if gender not in ["M", "F"]:
            gender = "M"

        row = {
            "amt": amt,
            "distance_km": distance_km,
            "customer_age": customer_age,
            "trans_hour": hour,
            "trans_dayofweek": dayofweek,
            "city_pop": city_pop,
            "category": category,
            "gender": gender,
        }

        df_single = pd.DataFrame([row])
        df_encoded = pd.get_dummies(df_single, columns=self.categorical_features, drop_first=True)

        for col in self.feature_columns:
            if col not in df_encoded.columns:
                df_encoded[col] = 0

        return df_encoded[self.feature_columns]
