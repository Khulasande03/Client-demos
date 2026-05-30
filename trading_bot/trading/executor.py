import MetaTrader5 as mt5
from datetime import datetime
from trading.risk import calc_sl_tp
from utils.logger import setup_logger, log_trade

logger = setup_logger()

SIGNAL_BUY  =  1
SIGNAL_SELL = -1
SIGNAL_HOLD =  0


def get_open_position(symbol: str):
    positions = mt5.positions_get(symbol=symbol)
    if positions:
        return positions[0]
    return None


def close_position(position, log_file: str):
    symbol = position.symbol
    lot    = position.volume
    order_type = mt5.ORDER_TYPE_SELL if position.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = mt5.symbol_info_tick(symbol).bid if order_type == mt5.ORDER_TYPE_SELL else mt5.symbol_info_tick(symbol).ask

    request = {
        "action":    mt5.TRADE_ACTION_DEAL,
        "symbol":    symbol,
        "volume":    lot,
        "type":      order_type,
        "position":  position.ticket,
        "price":     price,
        "deviation": 20,
        "magic":     123456,
        "comment":   "AI Bot Close",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        pnl = position.profit
        logger.info(f"CLOSED position #{position.ticket} | P&L: {pnl:.2f}")
        log_trade(log_file, {
            "time": datetime.utcnow().isoformat(),
            "action": "CLOSE",
            "symbol": symbol,
            "lots": lot,
            "price": price,
            "pnl": pnl,
            "ticket": position.ticket,
        })
    else:
        logger.error(f"Close failed: {result.retcode} {result.comment}")


def open_trade(symbol: str, signal: int, lot: float, sl_pips: float, tp_pips: float, log_file: str):
    order_type = mt5.ORDER_TYPE_BUY if signal == SIGNAL_BUY else mt5.ORDER_TYPE_SELL
    tick = mt5.symbol_info_tick(symbol)
    price = tick.ask if order_type == mt5.ORDER_TYPE_BUY else tick.bid

    sl, tp = calc_sl_tp(symbol, order_type, price, sl_pips, tp_pips)

    request = {
        "action":    mt5.TRADE_ACTION_DEAL,
        "symbol":    symbol,
        "volume":    lot,
        "type":      order_type,
        "price":     price,
        "sl":        sl,
        "tp":        tp,
        "deviation": 20,
        "magic":     123456,
        "comment":   "AI Bot Entry",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result.retcode == mt5.TRADE_RETCODE_DONE:
        direction = "BUY" if signal == SIGNAL_BUY else "SELL"
        logger.info(f"OPENED {direction} {lot} lots {symbol} @ {price} | SL: {sl} | TP: {tp} | Ticket: {result.order}")
        log_trade(log_file, {
            "time": datetime.utcnow().isoformat(),
            "action": direction,
            "symbol": symbol,
            "lots": lot,
            "price": price,
            "sl": sl,
            "tp": tp,
            "pnl": "",
            "ticket": result.order,
        })
        return result.order
    else:
        logger.error(f"Order failed: {result.retcode} {result.comment}")
        return None


def execute_signal(symbol: str, signal: int, confidence: float, cfg: dict, log_file: str):
    """
    Given a signal (BUY/SELL/HOLD) and confidence, manage the position:
    - Close opposite positions
    - Open new position if signal is actionable
    """
    position = get_open_position(symbol)
    threshold = cfg["model"]["signal_threshold"]

    if confidence < threshold:
        logger.info(f"Signal confidence {confidence:.2f} below threshold {threshold} — no action.")
        return

    if signal == SIGNAL_HOLD:
        logger.info("Signal: HOLD — no action.")
        return

    if position:
        is_buy_pos  = position.type == mt5.ORDER_TYPE_BUY
        is_sell_pos = position.type == mt5.ORDER_TYPE_SELL
        if (signal == SIGNAL_BUY and is_sell_pos) or (signal == SIGNAL_SELL and is_buy_pos):
            logger.info("Signal reversed — closing existing position.")
            close_position(position, log_file)
            position = None

    if position is None:
        from trading.risk import can_open_trade, daily_loss_exceeded
        if daily_loss_exceeded(cfg["risk"]["max_daily_loss_usd"]):
            return
        if not can_open_trade(symbol, cfg["trading"]["lot_size"], cfg["trading"]["max_open_trades"]):
            return
        open_trade(
            symbol=symbol,
            signal=signal,
            lot=cfg["trading"]["lot_size"],
            sl_pips=cfg["risk"]["stop_loss_pips"],
            tp_pips=cfg["risk"]["take_profit_pips"],
            log_file=log_file,
        )
