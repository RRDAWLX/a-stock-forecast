# A股K线预测

基于 Kronos 时序基础模型的 A 股 K 线预测网站。后端使用 FastAPI + Kronos-base 模型推理预测，前端使用 Next.js + lightweight-charts 展示 K 线图表。

## 页面示例

![页面截图](assets/demo.png)

## 功能

- **股票搜索** — 输入股票代码查询
- **K 线走势图** — 展示历史 K 线（红涨绿跌），天数可在 `config.jsonc` 的 `realDataDays` 配置
- **K 线预测** — 基于 Kronos-base 模型预测未来 K 线，天数可在 `config.jsonc` 的 `predOutputDays` 配置，空心蜡烛图显示
- **重叠对比** — 实际与预测 K 线重叠天数由 `config.jsonc` 的 `overlapDays` 配置，重叠区域同时渲染实心与空心蜡烛，直观对比预测准确度
- **图例切换** — 点击图例切换实际/预测 K 线显示，坐标轴保持不变
- **搜索记录** — 侧边栏记录查看历史，SSE 实时推送

## 技术栈

| 层面     | 选型                              |
| -------- | --------------------------------- |
| 前端框架 | Next.js (App Router) + TypeScript |
| K 线渲染 | lightweight-charts (TradingView)  |
| 样式     | Tailwind CSS                      |
| 后端框架 | FastAPI                           |
| 数据源   | akshare（东方财富 + 腾讯备用）    |
| 预测模型 | Kronos-base                       |
| 包管理   | pnpm（前端）+ uv（后端）          |

## 项目结构

```
frontend/             # Next.js 前端
  src/app/            # 页面路由
  src/components/     # 组件（NavBar, Sidebar, SearchBox, KLineChart 等）
  src/services/       # API 封装
  src/types/          # 类型定义

server/               # FastAPI 后端
  app/api/            # 路由（stock, history）
  app/services/       # 业务逻辑（predictor, stock_data, search_store）
  app/model/          # Kronos 模型定义
  app/schemas/        # 响应模型
  scripts/            # 预下载脚本
  models/             # 模型权重（git 忽略）
  data/               # 搜索记录（git 忽略）
```

## 快速开始

### 环境要求

- Python >= 3.10
- Node.js >= 18
- pnpm
- uv

### 后端

```bash
cd server

# 首次部署：预下载 Kronos 模型权重
uv run python scripts/preload_model.py

# 启动服务
uv run uvicorn app.main:app
```

模型权重下载到 `server/models/kronos-model/` 和 `server/models/kronos-tokenizer/`。

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端开发服务器默认运行在 `http://localhost:3000`，后端在 `http://localhost:8000`，端口可在 `config.jsonc` 中配置。

### 配置文件

项目根目录 `config.jsonc` 集中管理前后端公共配置：

| 字段             | 说明                    | 默认值 |
| ---------------- | ----------------------- | ------ |
| `frontend`       | 前端端口                | 3000   |
| `backend`        | 后端端口                | 8000   |
| `realDataDays`   | 实际 K 线图天数         | 65     |
| `predOutputDays` | 预测 K 线图天数         | 10     |
| `overlapDays`    | 实际与预测 K 线重叠天数 | 5      |

### 环境变量

| 变量                   | 位置                        | 说明                                                 |
| ---------------------- | --------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SSE_BASE` | `frontend/.env.development` | SSE 连接地址，开发环境为 `http://localhost:8000/api` |

## API

| 方法 | 路径                     | 说明                 |
| ---- | ------------------------ | -------------------- |
| GET  | `/api/stock?code=600519` | 获取 K 线数据 + 预测 |
| GET  | `/api/history`           | SSE 搜索记录推送     |

## 致谢

- [Kronos](https://github.com/shiyu-coder/Kronos) — 时序基础模型
- [akshare](https://github.com/akfamily/akshare) — A 股数据接口
- [lightweight-charts](https://github.com/tradingview/lightweight-charts) — TradingView 图表库

