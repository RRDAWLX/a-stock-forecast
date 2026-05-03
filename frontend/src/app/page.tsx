/** 首页：居中展示搜索框，侧边栏显示历史记录。 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import SearchBox from '@/components/SearchBox';

export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 搜索后跳转到股票详情页
  const handleSearch = (code: string) => {
    router.push(`/stock/${code}`);
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark">
      <NavBar onSidebarToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <main className="flex-1 flex items-center justify-center bg-white min-w-0">
          <div className="flex flex-col gap-4 w-[400px]">
            <SearchBox onSearch={handleSearch} />
          </div>
        </main>
        {sidebarOpen && <div className="w-px bg-[#E2E8F0] shrink-0" />}
        <Sidebar open={sidebarOpen} onSelect={handleSearch} />
      </div>
    </div>
  );
}