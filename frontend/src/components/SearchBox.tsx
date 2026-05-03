/** 搜索框组件：输入股票代码和 K 线参数后提交搜索，支持 loading 禁用状态。 */
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { KLineParams } from '@/services/api';

const DEFAULT_REAL_DATA_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_REAL_DATA_DAYS || 120);
const DEFAULT_PRED_OUTPUT_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_PRED_OUTPUT_DAYS || 30);
const DEFAULT_OVERLAP_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_OVERLAP_DAYS || 20);

type Layout = 'vertical' | 'horizontal';

interface SearchBoxProps {
  onSearch: (code: string, params: KLineParams) => void;
  loading?: boolean;
  defaultParams?: KLineParams;
  defaultCode?: string;
  layout?: Layout;
}

export default function SearchBox({
  onSearch,
  loading,
  defaultParams,
  defaultCode,
  layout = 'vertical',
}: SearchBoxProps) {
  const [code, setCode] = useState(defaultCode ?? '');
  const [realDataDays, setRealDataDays] = useState(
    String(defaultParams?.realDataDays ?? DEFAULT_REAL_DATA_DAYS),
  );
  const [predOutputDays, setPredOutputDays] = useState(
    String(defaultParams?.predOutputDays ?? DEFAULT_PRED_OUTPUT_DAYS),
  );
  const [overlapDays, setOverlapDays] = useState(
    String(defaultParams?.overlapDays ?? DEFAULT_OVERLAP_DAYS),
  );
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (defaultCode !== undefined) setCode(defaultCode);
  }, [defaultCode]);

  useEffect(() => {
    if (defaultParams) {
      setRealDataDays(String(defaultParams.realDataDays));
      setPredOutputDays(String(defaultParams.predOutputDays));
      setOverlapDays(String(defaultParams.overlapDays));
    }
  }, [defaultParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmed = code.trim();
    if (!trimmed) {
      setValidationError('请输入股票代码');
      return;
    }

    const r = parseInt(realDataDays, 10);
    const p = parseInt(predOutputDays, 10);
    const o = parseInt(overlapDays, 10);

    if (isNaN(r) || r <= 0 || isNaN(p) || p <= 0 || isNaN(o) || o < 0) {
      setValidationError('实际天数和预测天数必须大于 0，重叠天数不能为负');
      return;
    }
    if (o > Math.min(r, p)) {
      setValidationError('重叠天数不能大于实际天数和预测天数中的较小值');
      return;
    }

    onSearch(trimmed, { realDataDays: r, predOutputDays: p, overlapDays: o });
  };

  const inputClass =
    'w-full rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-2 text-sm outline-none focus:border-blue-400 text-text-primary placeholder:text-text-muted';

  if (layout === 'horizontal') {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-3 w-full">
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-text-secondary whitespace-nowrap">股票代码</label>
            <div className="flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] px-4 py-2.5 w-40">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入股票代码"
                disabled={loading}
                className="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-text-secondary whitespace-nowrap">实际天数</label>
            <input
              type="number"
              min={1}
              value={realDataDays}
              onChange={(e) => setRealDataDays(e.target.value)}
              disabled={loading}
              className="w-20 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-text-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-text-secondary whitespace-nowrap">预测天数</label>
            <input
              type="number"
              min={1}
              value={predOutputDays}
              onChange={(e) => setPredOutputDays(e.target.value)}
              disabled={loading}
              className="w-20 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-text-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-sm text-text-secondary whitespace-nowrap">重叠天数</label>
            <input
              type="number"
              min={0}
              value={overlapDays}
              onChange={(e) => setOverlapDays(e.target.value)}
              disabled={loading}
              className="w-20 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="ml-auto flex items-center justify-center min-w-[96px] px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span>搜索中...</span>
              </>
            ) : (
              <>
                <Search size={16} className="shrink-0" />
                <span>搜索</span>
              </>
            )}
          </button>
        </div>
        {validationError && <p className="text-xs text-rise mt-1">{validationError}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] px-4 py-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="请输入股票代码"
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">实际天数</label>
          <input
            type="number"
            min={1}
            value={realDataDays}
            onChange={(e) => setRealDataDays(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">预测天数</label>
          <input
            type="number"
            min={1}
            value={predOutputDays}
            onChange={(e) => setPredOutputDays(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-muted">重叠天数</label>
          <input
            type="number"
            min={0}
            value={overlapDays}
            onChange={(e) => setOverlapDays(e.target.value)}
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>
      {validationError && <p className="text-xs text-rise">{validationError}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>搜索中...</span>
          </>
        ) : (
          <>
            <Search size={16} />
            <span>搜索</span>
          </>
        )}
      </button>
    </form>
  );
}
