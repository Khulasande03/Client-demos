"""
MT5 AI Trading Bot
------------------
Start the bot by running:  python main.py

Make sure MetaTrader 5 is installed and running on your PC,
and that config.yaml has your correct account credentials.
"""

import sys
import time
import yaml
import MetaTrader5 as mt5

from data.collector import connect, disconnect, fetch_candles
from analysis.indicators import compute_features
from analysis.ml_model import load_or_train, train, predict
from trading.executor import execute_signal
from utils.logger import setup_logger

logger = setup_logger()


def load_config(path: str = "config.yaml") -> dict:
    with open(path, "r") as f:
        return yaml.safe_load(f)


def wait_for_new_bar(symbol: str, timeframe_str: str, last_bar_time) -> bool:
    """Returns True when a new candle has opened."""
    from data.collector import TIMEFRAME_MAP
    tf = TIMEFRAME_MAP[timeframe_str.upper()]
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, 1)
    if rates is not None and len(rates) > 0:
        return rates[0]["time"] != last_bar_time
    return False


def main():
    cfg = load_config()
    logger.setup = cfg["logging"]["verbose"]

    mt5_cfg  = cfg["mt5"]
    trade_cfg = cfg["trading"]
    model_cfg = cfg["model"]
    log_file  = cfg["logging"]["log_file"]

    # Connect to MetaTrader 5
    ok = connect(
        login=int(mt5_cfg["login"]),
        password=str(mt5_cfg["password"]),
        server=str(mt5_cfg["server"]),
    )
    if not ok:
        logger.error("Could not connect to MT5. Check config.yaml credentials and ensure MT5 is running.")
        sys.exit(1)

    symbol    = trade_cfg["symbol"]
    timeframe = trade_cfg["timeframe"]

    # Initial training
    logger.info("Fetching historical data for initial model training...")
    df_raw = fetch_candles(symbol, timeframe, model_cfg["training_bars"])
    df, feature_cols = compute_features(df_raw)
    model = load_or_train(df, feature_cols, model_cfg["future_bars"])

    bars_since_retrain = 0
    last_bar_time = None

    logger.info(f"Bot running | Symbol: {symbol} | Timeframe: {timeframe} | Waiting for new bars...")

    try:
        while True:
            # Poll every 5 seconds for a new bar
            time.sleep(5)

            rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_H1, 0, 1)
            if rates is None or len(rates) == 0:
                continue

            current_bar_time = rates[0]["time"]
            if current_bar_time == last_bar_time:
                continue  # Same bar, keep waiting

            last_bar_time = current_bar_time
            bars_since_retrain += 1
            logger.info(f"New bar detected at {current_bar_time}")

            # Fetch fresh data
            df_raw = fetch_candles(symbol, timeframe, model_cfg["training_bars"])
            df, feature_cols = compute_features(df_raw)

            # Retrain periodically
            if bars_since_retrain >= model_cfg["retrain_every_n_bars"]:
                logger.info("Retraining model on latest data...")
                model = train(df, feature_cols, model_cfg["future_bars"])
                bars_since_retrain = 0

            # Get prediction on the latest complete bar (index -2 to avoid leaking current open bar)
            latest = df.iloc[[-2]][feature_cols]
            signal, confidence = predict(model, latest)

            signal_name = {1: "BUY", -1: "SELL", 0: "HOLD"}.get(signal, "?")
            logger.info(f"ML Signal: {signal_name} | Confidence: {confidence:.2%}")

            execute_signal(symbol, signal, confidence, cfg, log_file)

    except KeyboardInterrupt:
        logger.info("Bot stopped by user.")
    finally:
        disconnect()


if __name__ == "__main__":
    main()
