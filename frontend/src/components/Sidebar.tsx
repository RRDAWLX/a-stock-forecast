/**
 * 侧边栏组件：通过 SSE 长连接实时接收搜索历史更新。
 * 支持自动断线重连（3 秒间隔），点击记录跳转到对应股票详情。
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createHistoryEventSource, type KLineParams } from '@/services/api';
import type { SearchHistoryItem } from '@/types';

interface SidebarProps {
  open: boolean;
  onSelect: (code: string, params: KLineParams) => void;
}

export default function Sidebar({ open, onSelect }: SidebarProps) {
  const [history, setHistory] = useState<SearchHistoryItem[] | null>(null);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectSSE = useCallback(() => {
    const es = createHistoryEventSource();
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch {
        // 忽略 JSON 解析错误
      }
    };
    es.onmessage = handleMessage;
    es.addEventListener('update', handleMessage as EventListener);
    es.onerror = () => {
      es.close();
      reconnectTimerRef.current = setTimeout(connectSSE, 3000);
    };
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      es.removeEventListener('update', handleMessage as EventListener);
      es.close();
    };
  }, []);

  useEffect(() => {
    const cleanup = connectSSE();
    return cleanup;
  }, [connectSSE]);

  if (!open) return null;

  return (
    <aside className="w-[260px] h-full bg-white flex flex-col gap-2 py-4 shrink-0">
      <div className="px-4">
        <h2 className="text-sm font-semibold text-text-primary">搜索记录</h2>
      </div>
      <div className="w-[220px] self-center h-px bg-border-subtle" />
      <div className="flex-1 overflow-y-auto px-0">
        {history?.map((item, index) => (
          <button
            key={`${item.code}-${item.time}-${index}`}
            onClick={() =>
              onSelect(item.code, {
                realDataDays: item.realDataDays,
                predOutputDays: item.predOutputDays,
                overlapDays: item.overlapDays,
              })
            }
            className="w-full flex flex-col gap-1 px-3.5 py-2.5 rounded-sm hover:bg-[#F1F5F9] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[13px] font-medium text-text-primary w-20 truncate">
                {item.name}
              </span>
              <span className="text-xs text-text-muted font-mono">{item.code}</span>
            </div>
            <div className="flex gap-2 text-[11px] text-text-muted">
              <span>实际{item.realDataDays}天</span>
              <span>预测{item.predOutputDays}天</span>
              <span>重叠{item.overlapDays}天</span>
            </div>
          </button>
        ))}
        {history && history.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">暂无记录</p>
        )}
        {history === null && <p className="text-xs text-text-muted text-center py-4">加载中...</p>}
      </div>
    </aside>
  );
}
