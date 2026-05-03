/**
 * 导航栏组件：左侧显示标题，右侧提供"新增"和"侧边栏"按钮。
 * "新增"按钮仅在详情页显示（返回首页搜索），侧边栏按钮控制面板显隐。
 */
'use client';

import { Plus, PanelRight } from 'lucide-react';

interface NavBarProps {
  onAddClick?: () => void;
  onSidebarToggle?: () => void;
}

export default function NavBar({ onAddClick, onSidebarToggle }: NavBarProps) {
  return (
    <nav className="w-full h-14 bg-bg-surface px-5 flex items-center justify-between">
      <span className="text-white text-lg font-semibold tracking-tight">A股K线预测</span>
      <div className="flex items-center gap-2">
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-bg-surface text-white/80 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span className="text-[13px] font-medium">新增</span>
          </button>
        )}
        <button
          onClick={onSidebarToggle}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-bg-surface text-white/80 hover:bg-blue-700 transition-colors"
        >
          <PanelRight size={16} />
          <span className="text-[13px] font-medium">侧边栏</span>
        </button>
      </div>
    </nav>
  );
}