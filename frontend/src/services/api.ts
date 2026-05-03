/** API 请求封装：REST 获取股票数据 + SSE 获取搜索历史。 */
import { StockResponse } from '@/types';

const API_BASE = '/api';
const SSE_BASE = process.env.NEXT_PUBLIC_SSE_BASE || '/api';

const pendingStockRequests = new Map<string, Promise<StockResponse>>();

export interface KLineParams {
  realDataDays: number;
  predOutputDays: number;
  overlapDays: number;
}

/** 根据股票代码和 K 线参数获取行情与预测数据（同一 code+params 自动去重） */
export function fetchStock(code: string, params: KLineParams): Promise<StockResponse> {
  const key = `${code}:${params.realDataDays}:${params.predOutputDays}:${params.overlapDays}`;
  const existing = pendingStockRequests.get(key);
  if (existing) return existing;

  const qs = new URLSearchParams({
    code,
    realDataDays: String(params.realDataDays),
    predOutputDays: String(params.predOutputDays),
    overlapDays: String(params.overlapDays),
  }).toString();

  const promise = fetch(`${API_BASE}/stock?${qs}`)
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `请求失败: ${res.status}`);
      }
      return res.json();
    })
    .finally(() => {
      pendingStockRequests.delete(key);
    });

  pendingStockRequests.set(key, promise);
  return promise;
}

/** 创建搜索历史的 SSE 长连接，用于实时接收更新推送 */
export function createHistoryEventSource(): EventSource {
  return new EventSource(`${SSE_BASE}/history`);
}
