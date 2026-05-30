import pandas as pd
import MetaTrader5 as mt5
from datetime import datetime
from utils.logger import setup_logger

logger = setup_logger()

TIMEFRAME_MAP = {
    "M1":  mt5.TIMEFRAME_M1,
    "M5":  mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1":  mt5.TIMEFRAME_H1,
    "H4":  mt5.TIMEFRAME_H4,
    "D1":  mt5.TIMEFRAME_D1,
}


def connect(login: int, password: str, server: str) -> bool:
    if not mt5.initialize():
        logger.error("MT5 initialize() failed")
        return False
    authorized = mt5.login(login, password=password, server=server)
    if not authorized:
        logger.error(f"MT5 login failed: {mt5.last_error()}")
        mt5.shutdown()
        return False
    info = mt5.account_info()
    logger.info(f"Connected to MT5 | Account: {info.login} | Balance: {info.balance} {info.currency}")
    return True


def disconnect():
    mt5.shutdown()
    logger.info("MT5 connection closed.")


def fetch_candles(symbol: str, timeframe_str: str, count: int) -> pd.DataFrame:
    tf = TIMEFRAME_MAP.get(timeframe_str.upper())
    if tf is None:
        raise ValueError(f"Unknown timeframe: {timeframe_str}")

    rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
    if rates is None or len(rates) == 0:
        raise RuntimeError(f"No data returned for {symbol} {timeframe_str}: {mt5.last_error()}")

    df = pd.DataFrame(rates)
    df["time"] = pd.to_datetime(df["time"], unit="s")
    df.set_index("time", inplace=True)
    df = df[["open", "high", "low", "close", "tick_volume"]].rename(
        columns={"tick_volume": "volume"}
    )
    logger.info(f"Fetched {len(df)} candles for {symbol} {timeframe_str}")
    return df
