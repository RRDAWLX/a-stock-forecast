"""Kronos 模型预测服务：单例加载模型并执行 K 线预测。"""

import sys
from pathlib import Path

import pandas as pd

from app.config import MODEL_DIR

# 将项目根目录加入 sys.path，以便导入 app.model
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.model import Kronos, KronosPredictor, KronosTokenizer

# 全局单例预测器，首次调用 predict 时懒加载
_predictor = None


def _load_predictor():
    """懒加载 Kronos 模型与 Tokenizer，初始化预测器单例。"""
    global _predictor
    if _predictor is not None:
        return

    model_path = str(MODEL_DIR / "kronos-model")
    tokenizer_path = str(MODEL_DIR / "kronos-tokenizer")

    tokenizer = KronosTokenizer.from_pretrained(tokenizer_path)
    model = Kronos.from_pretrained(model_path)

    _predictor = KronosPredictor(model, tokenizer, max_context=512)


def predict(
    real_data: list[dict],
    dates: list[str],
    real_data_days: int,
    pred_output_days: int,
    overlap_days: int,
) -> list[dict]:
    """
    对实际行情数据进行 K 线预测。

    Args:
        real_data: 实际 OHLCV +成交额 数据列表
        dates: 对应的日期字符串列表

    Returns:
        预测的 OHLCV 数据列表（每项包含 open/high/low/close/volume/amount）
    """
    _load_predictor()

    # 模型输入为前 realDataDays - overlapDays 天的实际数据
    lookback = min(real_data_days - overlap_days, len(real_data))
    pred_len = pred_output_days

    df = pd.DataFrame(real_data[:lookback])
    df = df.rename(
        columns={
            "open": "open",
            "high": "high",
            "low": "low",
            "close": "close",
            "volume": "volume",
            "amount": "amount",
        }
    )

    # 构造输入时间戳
    x_timestamp = pd.to_datetime(dates[:lookback])

    # 生成预测时间戳：从输入数据下一天（即 dates[lookback]）开始
    pred_start_idx = lookback
    if pred_start_idx < len(dates):
        pred_dates_list = dates[pred_start_idx:]
        future_dates = list(pd.to_datetime(pred_dates_list))
        current = future_dates[-1]
    else:
        current = pd.to_datetime(dates[-1])
        future_dates = []

    while len(future_dates) < pred_len:
        current += pd.Timedelta(days=1)
        while current.weekday() >= 5:  # 跳过周末
            current += pd.Timedelta(days=1)
        future_dates.append(current)
    y_timestamp = pd.Series(future_dates)

    # 调用 Kronos 模型进行自回归预测
    pred_df = _predictor.predict(
        df=df[["open", "high", "low", "close", "volume", "amount"]],
        x_timestamp=x_timestamp,
        y_timestamp=y_timestamp,
        pred_len=pred_len,
        T=1.0,
        top_p=0.9,
        sample_count=1,
        verbose=False,
    )

    # 将预测结果四舍五入后转为字典列表
    pred_data = []
    for _, row in pred_df.iterrows():
        pred_data.append(
            {
                "open": round(float(row["open"]), 2),
                "high": round(float(row["high"]), 2),
                "low": round(float(row["low"]), 2),
                "close": round(float(row["close"]), 2),
                "volume": round(float(row["volume"]), 0),
                "amount": round(float(row["amount"]), 2),
            }
        )

    return pred_data
