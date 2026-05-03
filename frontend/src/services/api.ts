/** API 请求封装：REST 获取股票数据 + SSE 获取搜索历史。 */
import { StockResponse } from '@/types';

// REST API 基础路径（通过 Next.js rewrite 代理到后端）
const API_BASE = '/api';
// SSE 基础路径（支持通过环境变量覆盖，用于直连后端场景）
const SSE_BASE = process.env.NEXT_PUBLIC_SSE_BASE || '/api';

const pendingStockRequests = new Map<string, Promise<StockResponse>>();

/** 根据股票代码获取行情与预测数据（同一 code 自动去重） */
export function fetchStock(code: string): Promise<StockResponse> {
  const existing = pendingStockRequests.get(code);
  if (existing) return existing;

  const promise = fetch(`${API_BASE}/stock?code=${encodeURIComponent(code)}`)
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `请求失败: ${res.status}`);
      }
      return res.json();
    })
    .finally(() => {
      pendingStockRequests.delete(code);
    });

  pendingStockRequests.set(code, promise);
  return promise;
}

/** 创建搜索历史的 SSE 长连接，用于实时接收更新推送 */
export function createHistoryEventSource(): EventSource {
  return new EventSource(`${SSE_BASE}/history`);
}