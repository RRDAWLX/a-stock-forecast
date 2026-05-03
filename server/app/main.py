"""FastAPI 应用入口，注册路由与中间件。"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.history import router as history_router
from app.api.stock import router as stock_router

app = FastAPI(title="A股K线预测", version="0.1.0")

# 允许所有来源跨域访问，便于前端开发调试
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册股票数据与搜索历史两个路由模块
app.include_router(stock_router)
app.include_router(history_router)
