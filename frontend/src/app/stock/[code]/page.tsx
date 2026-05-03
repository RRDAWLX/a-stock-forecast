/** 股票详情页：根据 URL 中的股票代码和 K 线参数获取行情数据，展示头部信息与 K 线图。 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { fetchStock, type KLineParams } from '@/services/api';
import type { StockResponse } from '@/types';
import NavBar from '@/components/NavBar';
import Sidebar from '@/components/Sidebar';
import StockHeader from '@/components/StockHeader';
import KLineChart from '@/components/KLineChart';
import SearchBox from '@/components/SearchBox';

const DEFAULT_REAL_DATA_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_REAL_DATA_DAYS || 120);
const DEFAULT_PRED_OUTPUT_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_PRED_OUTPUT_DAYS || 30);
const DEFAULT_OVERLAP_DAYS = Number(process.env.NEXT_PUBLIC_DEFAULT_OVERLAP_DAYS || 20);

export default function StockDetailPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<StockResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const klineParams: KLineParams = useMemo(
    () => ({
      realDataDays: Number(searchParams.get('realDataDays') || DEFAULT_REAL_DATA_DAYS),
      predOutputDays: Number(searchParams.get('predOutputDays') || DEFAULT_PRED_OUTPUT_DAYS),
      overlapDays: Number(searchParams.get('overlapDays') || DEFAULT_OVERLAP_DAYS),
    }),
    [searchParams],
  );

  const doFetch = useCallback((code: string, p: KLineParams) => {
    setLoading(true);
    setError('');
    fetchStock(code, p)
      .then(setData)
      .catch((e) => setError(e.message || '请求失败'))
      .finally(() => setLoading(false));
  }, []);

  const [fetchKey, setFetchKey] = useState('');
  const [isSearchInitiated, setIsSearchInitiated] = useState(false);

  useEffect(() => {
    if (!params.code) return;
    const key = `${params.code}:${klineParams.realDataDays}:${klineParams.predOutputDays}:${klineParams.overlapDays}`;
    if (isSearchInitiated && key === fetchKey) {
      setIsSearchInitiated(false);
      return;
    }
    setFetchKey(key);
    doFetch(params.code, klineParams);
  }, [params.code, klineParams, doFetch, fetchKey, isSearchInitiated]);

  const handleSearch = (code: string, searchParams: KLineParams) => {
    doFetch(code, searchParams);
    const qs = new URLSearchParams({
      realDataDays: String(searchParams.realDataDays),
      predOutputDays: String(searchParams.predOutputDays),
      overlapDays: String(searchParams.overlapDays),
    }).toString();
    setFetchKey(
      `${code}:${searchParams.realDataDays}:${searchParams.predOutputDays}:${searchParams.overlapDays}`,
    );
    setIsSearchInitiated(true);
    router.replace(`/stock/${code}?${qs}`, { scroll: false });
  };

  const handleSidebarSelect = (code: string, itemParams: KLineParams) => {
    doFetch(code, itemParams);
    const qs = new URLSearchParams({
      realDataDays: String(itemParams.realDataDays),
      predOutputDays: String(itemParams.predOutputDays),
      overlapDays: String(itemParams.overlapDays),
    }).toString();
    setFetchKey(
      `${code}:${itemParams.realDataDays}:${itemParams.predOutputDays}:${itemParams.overlapDays}`,
    );
    setIsSearchInitiated(true);
    router.replace(`/stock/${code}?${qs}`, { scroll: false });
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark">
      <NavBar
        onAddClick={() => router.push('/')}
        onSidebarToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <main className="flex-1 flex flex-col bg-white min-h-0 min-w-0">
          <div className="flex-1 flex flex-col gap-5 p-6 min-h-0">
            <SearchBox
              onSearch={handleSearch}
              loading={loading}
              defaultParams={klineParams}
              defaultCode={params.code}
              layout="horizontal"
            />
            {loading && !data && (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-text-muted">加载中...</span>
              </div>
            )}
            {error && !data && (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-rise">{error}</span>
              </div>
            )}
            {error && data && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-rise text-sm">
                <span>{error}</span>
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
        <Sidebar open={sidebarOpen} onSelect={handleSidebarSelect} />
      </div>
    </div>
  );
}
