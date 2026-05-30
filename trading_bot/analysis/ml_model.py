import os
import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from utils.logger import setup_logger

logger = setup_logger()
MODEL_PATH = "model.pkl"

LABEL_BUY  =  1
LABEL_SELL = -1
LABEL_HOLD =  0


def _generate_labels(df: pd.DataFrame, future_bars: int, threshold: float = 0.001) -> pd.Series:
    future_return = df["close"].shift(-future_bars) / df["close"] - 1
    labels = pd.Series(LABEL_HOLD, index=df.index)
    labels[future_return > threshold]  = LABEL_BUY
    labels[future_return < -threshold] = LABEL_SELL
    return labels


def train(df: pd.DataFrame, feature_cols: list, future_bars: int = 5) -> XGBClassifier:
    labels = _generate_labels(df, future_bars)
    valid = labels.notna() & df[feature_cols].notna().all(axis=1)
    X = df.loc[valid, feature_cols]
    y = labels[valid].map({LABEL_SELL: 0, LABEL_HOLD: 1, LABEL_BUY: 2})

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    report = classification_report(y_test, model.predict(X_test), target_names=["SELL", "HOLD", "BUY"])
    logger.info(f"Model trained.\n{report}")

    joblib.dump(model, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")
    return model


def load_or_train(df: pd.DataFrame, feature_cols: list, future_bars: int = 5) -> XGBClassifier:
    if os.path.exists(MODEL_PATH):
        logger.info(f"Loading existing model from {MODEL_PATH}")
        return joblib.load(MODEL_PATH)
    logger.info("No saved model found — training from scratch.")
    return train(df, feature_cols, future_bars)


def predict(model: XGBClassifier, latest_features: pd.DataFrame) -> tuple[int, float]:
    """Returns (signal, confidence) where signal is LABEL_BUY/SELL/HOLD."""
    proba = model.predict_proba(latest_features)[0]
    class_idx = int(np.argmax(proba))
    confidence = float(proba[class_idx])
    # class_idx: 0=SELL, 1=HOLD, 2=BUY
    signal_map = {0: LABEL_SELL, 1: LABEL_HOLD, 2: LABEL_BUY}
    return signal_map[class_idx], confidence
