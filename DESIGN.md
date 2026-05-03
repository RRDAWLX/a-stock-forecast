# A股K线预测网站 — 完整方案设计

---

## 一、产品需求

### 核心功能
1. **股票搜索** — 用户输入股票代码和 K 线参数（实际天数、预测天数、重叠天数），前端向后端发送请求
2. **K线走势图** — 展示历史K线数据（天数由搜索框参数决定，默认值来自 `config.jsonc` 的 `realDataDays`），红涨绿跌
3. **K线预测** — 基于Kronos-base模型预测未来K线（天数由搜索框参数决定，默认值来自 `config.jsonc` 的 `predOutputDays`），重叠天数由搜索框参数决定（默认值来自 `config.jsonc` 的 `overlapDays`），以空心蜡烛图显示
4. **搜索记录侧边栏** — 记录用户查看过的股票（含K线参数），点击可快速切换；后端主动推送更新
5. **图例切换** — 图例可点击切换实际K线/预测K线的显示与隐藏，切换时坐标轴不变

### 页面

| 页面 | 路由 | 说明 |
|---|---|---|
| 搜索首页 | `/` | NavBar（品牌名 + 侧边栏按钮）+ 中央 SearchBox（含K线参数输入）+ 右侧搜索记录侧边栏 |
| 股票详情页 | `/stock/[code]?realDataDays=120&predOutputDays=30&overlapDays=20` | NavBar（品牌名 + 新增按钮 + 侧边栏按钮）+ SearchBox（水平布局，含K线参数）+ 股票信息头部 + K线图表 + 右侧搜索记录侧边栏 |

---

## 二、数据流

```
┌──────────┐  1. 输入股票代码+参数  ┌──────────┐
│  前端    │ ──────────────────→ │  后端    │
│          │                     │          │
│  搜索框  │  4. 返回数据         │ stock.py │
│  K线图   │ ←────────────────── │          │
│  侧边栏  │                     │ predictor│
│          │  5. SSE推送搜索记录  │          │
│          │ ←────────────────── │history.py│
└──────────┘                     └──────────┘
                                      │
                           2. akshare获取realDataDays日数据（东方财富优先，腾讯备用）
                           3. 取前realDataDays-overlapDays天数据输入Kronos推理，输出predOutputDays天预测
                          6. 读写搜索记录文件
```

### 请求响应流程

1. 前端 `GET /api/stock?code=600519&realDataDays=120&predOutputDays=30&overlapDays=20`
2. 后端通过 akshare 获取最近 **请求参数天数**（`realDataDays`）数据（优先使用东方财富接口，网络不可用时自动切换腾讯接口）
3. 后端取数据进行 Kronos-base 推理，输入为前 `realDataDays - overlapDays` 天数据，预测时间戳从第 `realDataDays - overlapDays + 1` 天开始，共预测 `predOutputDays` 天
4. 后端组装响应返回前端：
   ```json
   {
     "stock_name": "贵州茅台",
     "stock_code": "600519.SH",
     "current_price": 1698.00,
     "price_change": "+2.35%",
     "real_data": [/* 实际行情 OHLCV */],
     "pred_data": [/* 预测行情 OHLCV */],
     "dates": [/* 实际日期 + 预测日期（去掉重叠部分） */]
   }
   ```
5. 后端写入搜索记录文件（含K线参数） → 通过 SSE 推送更新后的完整搜索记录列表

**预测逻辑**：模型输入为前 `realDataDays - overlapDays` 天的实际数据，预测时间戳从第 `realDataDays - overlapDays + 1` 天开始（即重叠区域第一天），共预测 `predOutputDays` 天。重叠区域内实际与预测 K 线同时渲染，用于视觉效果衔接和准确度对比。

**dates 数组结构**：`dates[0..real_len-1]` 对应 `real_data` 的日期，预测数据从 `real_len - overlap` 位置开始，实际日期之后的 `pred_len - overlap` 个日期为预测的未来工作日。前端通过 `dates.length - pred_data.length` 定位 `pred_data` 的起始日期索引。

---

## 三、模块划分

### 前端（frontend）

```
frontend/
├── scripts/
│   └── dev.js                  # 从 config.jsonc 读取前端端口，启动 next dev
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 搜索首页（NavBar + SearchBox + Sidebar）
│   │   ├── globals.css           # 全局样式
│   │   └── stock/
│   │       └── [code]/
│   │           └── page.tsx      # 股票详情页（NavBar + SearchBox + StockHeader + KLineChart + Sidebar）
│   ├── components/
│   │   ├── NavBar.tsx             # 顶部导航栏（品牌名 + 条件显示新增按钮 + 侧边栏按钮）
│   │   ├── Sidebar.tsx           # 搜索记录侧边栏（SSE连接 + 列表展示含K线参数 + 点击跳转）
│   │   ├── SearchBox.tsx         # 搜索输入框（股票代码 + K线参数输入，支持vertical/horizontal布局）
│   │   ├── StockHeader.tsx       # 股票头部信息（名称/代码/价格/涨跌幅）
│   │   ├── KLineChart.tsx        # K线图组件（lightweight-charts + 图例切换 + ResizeObserver + fitContent自适应横轴）
│   │   └── ToggleButton.tsx      # 开关按钮（支持实心/空心样式）
│   ├── services/
│   │   └── api.ts                # 后端接口封装（REST走Next.js代理，SSE直连后端，请求按code+params去重）
│   └── types/
│       ├── index.ts              # 类型定义（StockResponse, Ohlcv, SearchHistoryItem, KLineParams）
│       └── jsonc.d.ts            # jsonc 模块类型声明
├── .env.development              # 开发环境变量（NEXT_PUBLIC_SSE_BASE，由 sync_ports.py 生成）
├── next.config.ts                # 从 config.jsonc 读取端口与K线参数，注入环境变量 + API代理
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### 后端（server）

```
server/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI 入口 + 路由 + CORS
│   ├── config.py                # 全局配置（从 config.jsonc 读取端口与路径）
│   ├── api/
│   │   ├── __init__.py
│   │   ├── stock.py             # GET /api/stock（code + K线参数query params + 错误处理404/500 + SSE通知）
│   │   └── history.py           # GET /api/history（SSE推送，初始data事件 + update事件 + ping心跳）
│   ├── services/
│   │   ├── stock_data.py        # akshare 数据获取（东方财富优先→腾讯备用双源）
│   │   ├── predictor.py         # Kronos-base 模型推理（KronosPredictor，懒加载单例）
│   │   └── search_store.py      # 搜索记录读写（本地JSON文件，记录含K线参数）
│   ├── model/                   # Kronos 模型定义（KronosTokenizer、Kronos、KronosPredictor）
│   └── schemas/
│       └── response.py          # Pydantic 响应模型（StockResponse, Ohlcv, SearchHistoryItem）
├── scripts/
│   ├── run_dev.py               # 启动开发服务器（端口从 config.jsonc 读取）
│   ├── preload_model.py         # Kronos-base + Kronos-Tokenizer-base 预下载脚本
│   └── sync_ports.py            # 同步 config.jsonc 端口到 frontend/.env.development
├── data/
│   └── search_history.json      # 搜索记录文件（git忽略）
├── models/
│   ├── kronos-tokenizer/         # Kronos-Tokenizer-base 权重
│   └── kronos-model/            # Kronos-base 权重
├── pyproject.toml                # uv 项目配置
└── .gitignore
```

---

## 四、技术选型

| 层面 | 选型 | 理由 |
|---|---|---|
| **前端框架** | Next.js (App Router) + TypeScript | 用户指定 |
| **K线渲染** | lightweight-charts (TradingView) | 专业金融图表，支持自定义蜡烛样式 |
| **样式** | Tailwind CSS v4 | 与设计稿变量体系匹配 |
| **状态管理** | 无（组件内部 useState/useReducer） | 用户指定 |
| **搜索记录推送** | SSE（EventSource） | 后端单向推送，比 WebSocket 轻量 |
| **后端框架** | FastAPI | 异步、自带 OpenAPI、原生支持 SSE |
| **数据源** | akshare（东方财富 + 腾讯备用） | 免费 A 股数据接口，东财不可用时自动切换腾讯源 |
| **预测模型** | Kronos-base（via huggingface_hub PyTorchModelHubMixin） | 时序基础模型，适合 K 线预测 |
| **包管理** | pnpm（前端）+ uv（后端） | 用户指定 |
| **配置中心** | config.jsonc + jsonc 包 | 前后端端口、K线参数默认值统一管理 |
| **API代理** | Next.js rewrites | 开发环境前端 REST 请求代理到后端，SSE 直连 |

---

## 五、前后端接口定义

| 方法 | 路径 | 参数 | 返回 | 说明 |
|---|---|---|---|---|
| GET | `/api/stock` | `code`, `realDataDays`, `predOutputDays`, `overlapDays` (query) | `StockResponse` | 获取K线数据+预测；满足overlapDays校验；无效代码返回404 |
| GET | `/api/history` | — | SSE stream | 搜索记录推送（连接时发送默认事件，更新时发送update事件，空闲30秒发ping心跳） |

### StockResponse 结构

```typescript
interface StockResponse {
  stock_name: string      // "贵州茅台"
  stock_code: string      // "600519.SH"
  current_price: number   // 1698.00
  price_change: string    // "+2.35%"
  real_data: Ohlcv[]      // 实际行情，长度为 realDataDays
  pred_data: Ohlcv[]      // 预测行情，长度为 predOutputDays
  dates: string[]          // 实际日期 + 预测未来工作日日期（去掉重叠部分）
}

interface Ohlcv {
  open: number    // 开盘价
  high: number    // 最高价
  low: number     // 最低价
  close: number   // 收盘价
  volume: number  // 成交量（股），腾讯源无此项时为0
  amount: number  // 成交额（元）
}
```

### SearchHistoryItem 结构

```json
{
  "code": "600519",
  "name": "贵州茅台",
  "time": "2026-05-02T10:30:00",
  "realDataDays": 120,
  "predOutputDays": 30,
  "overlapDays": 20
}
```

---

## 六、搜索记录机制

- **存储**：`data/search_history.json`，git 忽略
- **规则**：每次新增前删除同 code 且同 K 线参数的旧记录，然后插入到列表头部
- **去重键**：`code + realDataDays + predOutputDays + overlapDays`（同一股票不同参数视为不同记录）
- **推送**：SSE 端点 `GET /api/history`，后端每次成功请求后主动推送最新完整列表
  - 连接时发送默认事件（`data: [...]`，无event字段），前端 `onmessage` 接收
  - 更新时发送 `event: update` 事件，前端 `addEventListener("update", ...)` 接收
  - 空闲时每 30 秒发送 `event: ping` 心跳
- **前端适配**：侧边栏每条记录显示K线参数，点击时传递完整参数跳转

---

## 七、关键设计决策

1. **K线参数可配置**：`config.jsonc` 中定义默认值（realDataDays=120, predOutputDays=30, overlapDays=20），前端搜索框允许用户调整参数，URL query string 传递参数
2. **重叠区渲染**：实际与预测 K 线在重叠天数同时渲染实际数据和预测数据，实际数据实心、预测数据空心，用户可直观对比预测准确度；重叠之后的日期只显示预测空心蜡烛
3. **图例切换**：点击图例可切换实际K线/预测K线的显示与隐藏，隐藏时仅不渲染对应蜡烛，坐标轴（Y轴价格范围、X轴时间范围）保持不变
4. **预测K线样式**：实心填充=实际，空心描边=预测（设计稿定义了 `RealCandle` / `PredCandle` 两套样式）
5. **配色遵循中国惯例**：红涨绿跌
6. **SSE vs WebSocket**：搜索记录推送是单向的，SSE 更简单够用。但 Next.js 开发模式的 rewrite 不支持 SSE 流式转发，因此 SSE 连接直连后端（`NEXT_PUBLIC_SSE_BASE` 环境变量），REST API 仍走 Next.js 代理
7. **预测输入**：模型输入为前 `realDataDays - overlapDays` 天的实际数据（而非全部实际数据），预测时间戳从输入数据的下一天开始，这样重叠区域的预测结果可与实际数据直接对比
8. **模型加载**：使用 `huggingface_hub.PyTorchModelHubMixin` 加载 Kronos-base 模型和 Kronos-Tokenizer-base 分词器，项目启动前通过 `scripts/preload_model.py` 预下载到 `models/kronos-model/` 和 `models/kronos-tokenizer/` 目录，运行时从本地路径懒加载（首次请求时初始化单例），避免在线下载
9. **无全局状态管理**：所有状态封装在组件内部，搜索记录通过 SSE 实时同步到 Sidebar 组件
10. **双数据源**：akshare 的东方财富接口（`stock_zh_a_hist`）为主，腾讯接口（`stock_zh_a_hist_tx`）为备用。东方财富不可用时自动切换腾讯源，确保数据获取的可靠性
11. **错误处理**：无效股票代码返回 HTTP 404，服务端错误返回 HTTP 500，前端显示错误提示信息
12. **NavBar 条件显示**：首页不显示"新增"按钮，股票详情页显示"新增"按钮和"侧边栏"按钮
13. **布局自适应**：flex 布局链中每个 `flex-1` 项目均设置 `min-w-0` 防止内容撑开容器；侧边栏收起时分隔线同步隐藏，打开时主内容区自动收缩让出空间；K线图容器宽度变化后 `ResizeObserver` 触发 `fitContent()` 自动重排横轴日期分布
14. **Y轴锁定**：数据加载并 `fitContent()` 后，对右侧价格轴设置 `autoScale: false`，确保图例切换时纵坐标不随可见系列变化
15. **请求去重**：前端 `fetchStock` 按 `code:realDataDays:predOutputDays:overlapDays` 键缓存进行中的请求，避免重复请求
16. **配置中心**：`config.jsonc` 作为唯一配置源，前端通过 `next.config.ts` 读取并注入环境变量，后端通过 `config.py` 读取；端口变更通过 `sync_ports.py` 同步到 `frontend/.env.development`
17. **搜索框布局**：首页搜索框为垂直布局（大输入框+三列参数网格），详情页搜索框为水平布局（一行展示代码+参数+按钮）
18. **URL驱动的参数传递**：股票详情页通过 URL query string 携带K线参数，确保可分享、可刷新恢复

---

## 八、启动流程

```
# 后端
cd server
uv run python scripts/preload_model.py    # 首次部署，预下载模型
uv run scripts/run_dev.py                  # 启动服务（端口从 config.jsonc 读取）

# 前端
cd frontend
pnpm install
pnpm dev    # 运行 node scripts/dev.js，端口从 config.jsonc 读取

# 端口同步（修改 config.jsonc 端口后需执行）
cd server && uv run scripts/sync_ports.py
```

### 环境变量

| 变量 | 来源 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_SSE_BASE` | `frontend/.env.development`（由 `sync_ports.py` 生成） | SSE 连接地址，开发环境直连后端 `http://localhost:8000/api` |
| `NEXT_PUBLIC_DEFAULT_REAL_DATA_DAYS` | `next.config.ts` 从 `config.jsonc` 注入 | 实际K线默认天数 |
| `NEXT_PUBLIC_DEFAULT_PRED_OUTPUT_DAYS` | `next.config.ts` 从 `config.jsonc` 注入 | 预测K线默认天数 |
| `NEXT_PUBLIC_DEFAULT_OVERLAP_DAYS` | `next.config.ts` 从 `config.jsonc` 注入 | 重叠天数默认值 |