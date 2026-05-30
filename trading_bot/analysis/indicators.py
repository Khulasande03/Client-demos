import pandas as pd
import pandas_ta as ta


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df.ta.ema(length=20, append=True)
    df.ta.ema(length=50, append=True)
    df.ta.rsi(length=14, append=True)
    df.ta.macd(fast=12, slow=26, signal=9, append=True)
    df.ta.bbands(length=20, std=2, append=True)
    df.ta.atr(length=14, append=True)

    df["ema_cross"] = (df["EMA_20"] > df["EMA_50"]).astype(int)
    df["bb_position"] = (df["close"] - df["BBL_20_2.0"]) / (
        df["BBU_20_2.0"] - df["BBL_20_2.0"] + 1e-9
    )
    df["price_change"] = df["close"].pct_change()
    df["high_low_range"] = (df["high"] - df["low"]) / df["close"]

    feature_cols = [
        "EMA_20", "EMA_50", "ema_cross",
        "RSI_14",
        "MACD_12_26_9", "MACDh_12_26_9", "MACDs_12_26_9",
        "bb_position",
        "ATRr_14",
        "price_change", "high_low_range",
    ]

    df = df.dropna(subset=feature_cols)
    return df, feature_cols
