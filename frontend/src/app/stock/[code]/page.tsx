/** 股票详情页：根据 URL 中的股票代码获取行情数据，展示头部信息与 K 线图。 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchStock } from '@/services/api';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import StockHeader from '@/components/StockHeader';
import KLineChart from '@/components/KLineChart';

import type { StockResponse } from '@/types';

export default function StockDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [data, setData] = useState<StockResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lastFetchedCode = useRef<string | null>(null);

  useEffect(() => {
    if (!params.code) return;
    if (lastFetchedCode.current === params.code && !error) return;
    lastFetchedCode.current = params.code;
    setLoading(true);
    setError('');
    fetchStock(params.code)
      .then(setData)
      .catch((e) => setError(e.message || '请求失败'))
      .finally(() => setLoading(false));
  }, [params.code]);

  const handleSearch = (code: string) => {
    router.push(`/stock/${code}`);
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark">
      <NavBar
        // "新增"按钮返回首页
        onAddClick={() => router.push('/')}
        onSidebarToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <main className="flex-1 flex flex-col bg-white min-h-0 min-w-0">
          <div className="flex-1 flex flex-col gap-5 p-6 min-h-0">
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-text-muted">加载中...</span>
              </div>
            )}
            {error && (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-rise">{error}</span>
              </div>
            )}
            {data && (
              <>
                <StockHeader
                  name={data.stock_name}
                  code={data.stock_code}
                  price={data.current_price}
                  change={data.price_change}
                />
                <div className="flex-1 flex flex-col p-4 rounded-lg bg-white min-h-0 min-w-0">
                  <KLineChart
                    realData={data.real_data}
                    predData={data.pred_data}
                    dates={data.dates}
                  />
                </div>
              </>
            )}
          </div>
        </main>
        {sidebarOpen && <div className="w-px bg-[#E2E8F0] shrink-0" />}
        <Sidebar open={sidebarOpen} onSelect={handleSearch} />
      </div>
    </div>
  );
}