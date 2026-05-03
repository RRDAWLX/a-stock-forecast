"""搜索历史 SSE 推送接口：前端通过长连接接收实时更新。"""

import asyncio
import contextlib
import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.services import search_store

router = APIRouter(prefix="/api")

# 所有活跃的 SSE 客户端队列
_connections: list[asyncio.Queue] = []


def notify_clients():
    """向所有已连接的 SSE 客户端推送最新搜索历史。由 stock API 调用。"""
    items = search_store.load_history()
    data = json.dumps([item.model_dump() for item in items], ensure_ascii=False)
    for q in _connections:
        with contextlib.suppress(Exception):
            q.put_nowait(data)


@router.get("/history")
async def history_stream() -> EventSourceResponse:
    """
    SSE 长连接端点。

    连接建立后立即推送当前搜索历史，
    之后在每次搜索时通过 notify_clients 推送更新，
    空闲时每 30 秒发送心跳包保持连接。
    """
    async def event_generator() -> AsyncGenerator:
        queue: asyncio.Queue = asyncio.Queue()
        _connections.append(queue)

        # 首次连接时推送当前历史
        items = search_store.load_history()
        data = json.dumps([item.model_dump() for item in items], ensure_ascii=False)
        yield {"data": data}

        try:
            while True:
                try:
                    # 等待推送更新，超时 30 秒则发心跳
                    msg = await asyncio.wait_for(queue.get(), timeout=30)
                    yield {"data": msg, "event": "update"}
                except asyncio.TimeoutError:
                    yield {"data": "", "event": "ping"}
        finally:
            # 连接断开时清理队列
            if queue in _connections:
                _connections.remove(queue)

    return EventSourceResponse(event_generator())