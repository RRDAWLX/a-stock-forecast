/** 搜索框组件：输入股票代码后提交搜索，支持 loading 禁用状态。 */
'use client';

import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (code: string) => void;
  loading?: boolean;
}

export default function SearchBox({ onSearch, loading }: SearchBoxProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSearch(trimmed);
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F1F5F9] px-4 py-3">
        <Search size={18} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="请输入股票代码"
          disabled={loading}
          className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
      </div>
    </form>
  );
}