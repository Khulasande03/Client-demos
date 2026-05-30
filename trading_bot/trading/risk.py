import MetaTrader5 as mt5
from utils.logger import setup_logger

logger = setup_logger()


def get_point(symbol: str) -> float:
    info = mt5.symbol_info(symbol)
    if info is None:
        raise RuntimeError(f"Symbol not found: {symbol}")
    return info.point


def pips_to_price(symbol: str, pips: float) -> float:
    """Convert pip count to price distance (handles 5-digit brokers)."""
    info = mt5.symbol_info(symbol)
    digits = info.digits
    pip_size = 10 ** -(digits - 1) if digits >= 4 else 10 ** -digits
    return pips * pip_size


def calc_sl_tp(symbol: str, order_type: int, price: float, sl_pips: float, tp_pips: float):
    dist = pips_to_price(symbol, sl_pips)
    tp_dist = pips_to_price(symbol, tp_pips)
    if order_type == mt5.ORDER_TYPE_BUY:
        sl = round(price - dist, mt5.symbol_info(symbol).digits)
        tp = round(price + tp_dist, mt5.symbol_info(symbol).digits)
    else:
        sl = round(price + dist, mt5.symbol_info(symbol).digits)
        tp = round(price - tp_dist, mt5.symbol_info(symbol).digits)
    return sl, tp


def can_open_trade(symbol: str, lot_size: float, max_open: int) -> bool:
    positions = mt5.positions_get(symbol=symbol)
    if positions is None:
        positions = []
    if len(positions) >= max_open:
        logger.info(f"Max open trades ({max_open}) reached — skipping new entry.")
        return False
    return True


def daily_loss_exceeded(max_loss_usd: float) -> bool:
    account = mt5.account_info()
    if account is None:
        return False
    daily_pnl = account.profit  # unrealised + realised for this session
    if daily_pnl <= -abs(max_loss_usd):
        logger.warning(f"Daily loss limit hit (P&L: {daily_pnl:.2f}) — bot paused.")
        return True
    return False
