"""API 响应数据模型定义。"""

from pydantic import BaseModel


class Ohlcv(BaseModel):
    """单根 K 线的 OHLCV 数据（开高低收量额）。"""
    open: float
    high: float
    low: float
    close: float
    volume: float
    amount: float


class StockResponse(BaseModel):
    """股票查询接口的完整响应，包含实际行情与预测数据。"""
    stock_name: str
    stock_code: str
    current_price: float
    price_change: str
    real_data: list[Ohlcv]
    pred_data: list[Ohlcv]
    dates: list[str]


class SearchHistoryItem(BaseModel):
    """搜索历史记录条目。"""
    code: str
    name: str
    time: str