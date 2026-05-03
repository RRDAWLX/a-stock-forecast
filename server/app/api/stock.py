"""股票数据查询 API：获取行情 + 模型预测 + 日期拼接。"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, model_validator

from app.api.history import notify_clients
from app.schemas.response import Ohlcv, StockResponse
from app.services import predictor, search_store, stock_data

router = APIRouter(prefix="/api")


class StockQueryParams(BaseModel):
    """K 线查询参数，含跨字段校验。"""

    code: str
    realDataDays: int
    predOutputDays: int
    overlapDays: int

    @model_validator(mode="after")
    def validate_overlap(self) -> StockQueryParams:
        if self.overlapDays > min(self.realDataDays, self.predOutputDays):
            raise ValueError(
                f"overlapDays({self.overlapDays}) 不能大于 realDataDays({self.realDataDays}) 和 predOutputDays({self.predOutputDays}) 中的较小值"
            )
        return self


@router.get("/stock", response_model=StockResponse)
async def get_stock(
    code: str = Query(..., description="股票代码"),
    realDataDays: int = Query(..., gt=0, description="实际K线天数"),
    predOutputDays: int = Query(..., gt=0, description="预测K线天数"),
    overlapDays: int = Query(..., ge=0, description="重叠天数"),
):
    """
    查询股票行情并进行 K 线预测。

    流程：
    1. 从数据源获取最近配置天数的实际行情
    2. 若数据充足，调用 Kronos 模型预测未来配置天数
    3. 拼接实际日期与预测日期（前配置天数重叠用于视觉衔接）
    4. 记录搜索历史并通过 SSE 推送给前端
    """
    params = StockQueryParams(
        code=code, realDataDays=realDataDays, predOutputDays=predOutputDays, overlapDays=overlapDays
    )

    # 在线程池中执行同步的数据获取，避免阻塞事件循环
    try:
        info: dict[str, Any] = await asyncio.to_thread(
            stock_data.fetch_stock_data, params.code, params.realDataDays
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取股票数据失败: {str(e)}") from None

    # 数据量充足时才进行预测
    raw_real: list[dict[str, float]] = info["real_data"]
    if len(raw_real) >= params.realDataDays - params.overlapDays:
        raw_pred: list[dict[str, float]] = await asyncio.to_thread(
            predictor.predict,
            raw_real,
            info["dates"],
            params.realDataDays,
            params.predOutputDays,
            params.overlapDays,
        )
    else:
        raw_pred = []

    real_data = [Ohlcv(**d) for d in raw_real]
    pred_data = [Ohlcv(**d) for d in raw_pred]

    # 计算预测日期，前 overlap 天与实际日期重叠，后续为未来工作日
    overlap = min(params.overlapDays, len(real_data), len(pred_data))
    pred_dates: list[str] = []
    dates: list[str] = info["dates"]
    for i in range(len(pred_data)):
        if i < overlap and len(real_data) - overlap + i < len(dates):
            # 重叠部分直接使用实际日期
            pred_dates.append(dates[len(real_data) - overlap + i])
        else:
            # 非重叠部分从最后日期开始推算工作日
            if pred_dates:
                last_pred = datetime.strptime(pred_dates[-1], "%Y-%m-%d")
            else:
                last_pred = (
                    datetime.strptime(dates[-1], "%Y-%m-%d") if dates else datetime(2026, 1, 1)
                )
            dt = last_pred + timedelta(days=1)
            while dt.weekday() >= 5:  # 跳过周末
                dt += timedelta(days=1)
            pred_dates.append(dt.strftime("%Y-%m-%d"))

    # 合并日期列表：实际日期 + 预测日期（去掉重叠部分）
    all_dates = dates + pred_dates[overlap:]

    # 记录搜索历史并通知前端 SSE 客户端
    short_code = str(info["stock_code"]).split(".")[0]
    await asyncio.to_thread(
        search_store.add_search_record,
        short_code,
        str(info["stock_name"]),
        params.realDataDays,
        params.predOutputDays,
        params.overlapDays,
    )
    notify_clients()

    return StockResponse(
        stock_name=str(info["stock_name"]),
        stock_code=str(info["stock_code"]),
        current_price=float(info["current_price"]),
        price_change=str(info["price_change"]),
        real_data=real_data,
        pred_data=pred_data,
        dates=all_dates,
    )
