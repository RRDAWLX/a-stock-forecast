/**
 * 侧边栏组件：通过 SSE 长连接实时接收搜索历史更新。
 * 支持自动断线重连（3 秒间隔），点击记录跳转到对应股票详情。
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createHistoryEventSource } from '@/services/api';
import type { SearchHistoryItem } from '@/types';

interface SidebarProps {
  open: boolean;
  onSelect: (code: string) => void;
}

export default function Sidebar({ open, onSelect }: SidebarProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 建立 SSE 连接，监听搜索历史更新，断线后 3 秒自动重连
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
    // 监听默认消息和自定义 update 事件
    es.onmessage = handleMessage;
    es.addEventListener('update', handleMessage as EventListener);
    es.onerror = () => {
      es.close();
      setTimeout(connectSSE, 3000);
    };
    return () => {
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
        {history.map((item) => (
          <button
            key={item.code}
            onClick={() => onSelect(item.code)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm hover:bg-[#F1F5F9] transition-colors text-left cursor-pointer"
          >
            <span className="text-[13px] font-medium text-text-primary w-20 truncate">
              {item.name}
            </span>
            <span className="text-xs text-text-muted font-mono">{item.code}</span>
          </button>
        ))}
        {history.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">暂无记录</p>
        )}
      </div>
    </aside>
  );
}