"""股票数据获取服务：优先从东方财富获取，失败后降级到腾讯数据源。"""

import requests as _req  # noqa: E402

# 修补 requests.Session，禁用代理（防止在服务器环境中走代理导致连接失败）
_orig_init = _req.Session.__init__


def _patched_init(self, *a, **kw):
    _orig_init(self, *a, **kw)
    self.trust_env = False


_req.Session.__init__ = _patched_init

import akshare as ak  # noqa: E402
import pandas as pd  # noqa: E402

# 股票名称缓存，避免重复网络请求
_name_cache: dict[str, str] = {}


def _normalize_code(code: str) -> str:
    """将简写股票代码转换为带市场后缀的标准格式（如 600519 → 600519.SH）。"""
    code = code.strip()
    if "." in code:
        return code
    if code.startswith("6"):
        return f"{code}.SH"
    elif code.startswith("0") or code.startswith("3"):
        return f"{code}.SZ"
    elif code.startswith("8") or code.startswith("4"):
        return f"{code}.BJ"
    return f"{code}.SH"


def _tx_prefix(code: str) -> str:
    """将股票代码转换为腾讯数据源格式（如 sh600519、sz000001）。"""
    full = _normalize_code(code)
    market, _ = full.split(".")
    if market == code:
        if code.startswith("6"):
            return f"sh{code}"
        elif code.startswith("0") or code.startswith("3"):
            return f"sz{code}"
        elif code.startswith("8") or code.startswith("4"):
            return f"bj{code}"
        return f"sh{code}"
    mkt = full.split(".")[1].lower()
    return f"{mkt}{full.split('.')[0]}"


def _get_stock_name(code: str) -> str:
    """通过 akshare 获取股票名称，结果会缓存以减少网络请求。"""
    raw = code.strip()
    if raw in _name_cache:
        return _name_cache[raw]
    try:
        info_df = ak.stock_info_a_code_name()
        for _, row in info_df.iterrows():
            _name_cache[str(row["code"])] = str(row["name"])
    except Exception:
        pass
    return _name_cache.get(raw, raw)


def _fetch_eastmoney(code: str, real_data_days: int):
    """从东方财富数据源获取股票日线行情（前复权）。"""
    raw_code = code.strip()
    df: pd.DataFrame = ak.stock_zh_a_hist(
        symbol=raw_code,
        period="daily",
        adjust="qfq",  # 前复权
    )
    if df.empty:
        raise ValueError(f"未找到股票数据: {raw_code}")

    # 取最近 REAL_DATA_DAYS 天的数据
    df = df.tail(real_data_days).reset_index(drop=True)

    # 计算当前价格与涨跌幅
    stock_name = str(df.iloc[-1]["股票名称"])
    current_price = float(df.iloc[-1]["收盘"])
    prev_close = float(df.iloc[-2]["收盘"]) if len(df) > 1 else current_price
    change_pct = ((current_price - prev_close) / prev_close) * 100
    price_change = f"+{change_pct:.2f}%" if change_pct >= 0 else f"{change_pct:.2f}%"

    real_data = []
    dates = []
    for _, row in df.iterrows():
        real_data.append(
            {
                "open": float(row["开盘"]),
                "high": float(row["最高"]),
                "low": float(row["最低"]),
                "close": float(row["收盘"]),
                "volume": float(row["成交量"]),
                "amount": float(row["成交额"]),
            }
        )
        dates.append(str(row["日期"])[:10])

    return {
        "stock_name": stock_name,
        "stock_code": _normalize_code(raw_code),
        "current_price": round(current_price, 2),
        "price_change": price_change,
        "real_data": real_data,
        "dates": dates,
    }


def _fetch_tencent(code: str, real_data_days: int):
    """从腾讯数据源获取股票日线行情（前复权），作为东方财富的备选。"""
    raw_code = code.strip()
    tx_prefix = _tx_prefix(raw_code)

    df: pd.DataFrame = ak.stock_zh_a_hist_tx(
        symbol=tx_prefix,
        adjust="qfq",
    )
    if df.empty:
        raise ValueError(f"未找到股票数据: {raw_code}")

    df = df.tail(real_data_days).reset_index(drop=True)

    stock_name = _get_stock_name(raw_code)
    current_price = float(df.iloc[-1]["close"])
    prev_close = float(df.iloc[-2]["close"]) if len(df) > 1 else current_price
    change_pct = ((current_price - prev_close) / prev_close) * 100
    price_change = f"+{change_pct:.2f}%" if change_pct >= 0 else f"{change_pct:.2f}%"

    real_data = []
    dates = []
    for _, row in df.iterrows():
        real_data.append(
            {
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                # 腾讯数据源 volume 字段名与 amount 相同
                "volume": float(row.get("amount", 0)),
                "amount": float(row.get("amount", 0)),
            }
        )
        dates.append(str(row["date"])[:10])

    return {
        "stock_name": stock_name,
        "stock_code": _normalize_code(raw_code),
        "current_price": round(current_price, 2),
        "price_change": price_change,
        "real_data": real_data,
        "dates": dates,
    }


def fetch_stock_data(code: str, real_data_days: int) -> dict:
    """
    获取股票行情数据，优先使用东方财富源，失败后降级到腾讯源。

    Args:
        code: 股票代码（支持简写如 600519 或标准格式如 600519.SH）
        real_data_days: 获取最近多少天的实际数据

    Returns:
        包含 stock_name/stock_code/current_price/price_change/real_data/dates 的字典
    """
    raw_code = code.strip()
    try:
        return _fetch_eastmoney(raw_code, real_data_days)
    except Exception:
        pass
    try:
        return _fetch_tencent(raw_code, real_data_days)
    except (ValueError, IndexError) as e:
        raise ValueError(f"未找到股票数据: {raw_code}") from e
    except Exception as e:
        raise ValueError(f"获取股票数据失败: {raw_code}") from e
