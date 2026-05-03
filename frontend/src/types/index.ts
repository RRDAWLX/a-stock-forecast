/** 全局类型定义，与后端 Pydantic 模型对应。 */

/** 单根 K 线 OHLCV 数据 */
export interface Ohlcv {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
}

/** 股票查询接口响应：包含实际行情、预测数据与日期列表 */
export interface StockResponse {
  stock_name: string;
  stock_code: string;
  current_price: number;
  price_change: string;
  real_data: Ohlcv[];
  pred_data: Ohlcv[];
  dates: string[];
}

/** 搜索历史记录条目 */
export interface SearchHistoryItem {
  code: string;
  name: string;
  time: string;
  realDataDays: number;
  predOutputDays: number;
  overlapDays: number;
}
