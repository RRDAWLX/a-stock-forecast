/**
 * K 线图组件：使用 lightweight-charts 渲染实际 K 线与预测 K 线。
 * - 实际 K 线使用实心填充（红涨绿跌）
 * - 预测 K 线使用仅边框/影线（浅红浅绿），与实际 K 线视觉区分
 * - 支持通过 ToggleButton 切换显隐
 * - 重叠区域用于预测与实际的视觉平滑衔接
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
} from 'lightweight-charts';
import ToggleButton from './ToggleButton';

interface KLineChartProps {
  realData: { open: number; high: number; low: number; close: number }[];
  predData: { open: number; high: number; low: number; close: number }[];
  dates: string[];
}

export default function KLineChart({ realData, predData, dates }: KLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const realSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const predSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  // 控制实际/预测 K 线的显隐状态
  const [showReal, setShowReal] = useState(true);
  const [showPred, setShowPred] = useState(true);

  // 初始化图表：创建实例、添加系列、监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: '#94A3B8',
        fontSize: 10,
      },
      grid: {
        horzLines: { color: '#E2E8F0' },
        vertLines: { color: '#E2E8F0' },
      },
      timeScale: {
        borderColor: '#E2E8F0',
        timeVisible: false,
      },
      crosshair: {
        horzLine: { color: '#94A3B8', style: 2 },
        vertLine: { color: '#94A3B8', style: 2 },
      },
    });

    chartRef.current = chart;

    // 实际 K 线系列：红色涨、绿色跌，实心填充
    const realSeries = chart.addCandlestickSeries({
      upColor: '#DC2626',
      downColor: '#16A34A',
      borderUpColor: '#DC2626',
      borderDownColor: '#16A34A',
      wickUpColor: '#DC2626',
      wickDownColor: '#16A34A',
    });

    // 预测 K 线系列：仅显示边框和影线，填充透明以区分
    const predSeries = chart.addCandlestickSeries({
      upColor: 'rgba(248, 113, 113, 0)',
      downColor: 'rgba(74, 222, 128, 0)',
      borderUpColor: '#F87171',
      borderDownColor: '#4ADE80',
      wickUpColor: '#F87171',
      wickDownColor: '#4ADE80',
    });

    realSeriesRef.current = realSeries;
    predSeriesRef.current = predSeries;

    // 响应容器尺寸变化，自动调整图表宽高
    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        chart.timeScale().fitContent();
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize();

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, []);

  // 数据变化时更新图表数据
  useEffect(() => {
    if (!chartRef.current) return;

    const allData: CandlestickData<Time>[] = [];
    const realSeriesData: CandlestickData<Time>[] = [];
    const predSeriesData: CandlestickData<Time>[] = [];

    // 构造实际 K 线数据
    for (let i = 0; i < realData.length; i++) {
      const d = realData[i];
      const time = dates[i] as Time;
      const item: CandlestickData<Time> = {
        time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      };
      realSeriesData.push(item);
      allData.push(item);
    }

    // 构造预测 K 线数据，日期从重叠区域开始
    const overlapStart = dates.length - predData.length;
    for (let i = 0; i < predData.length; i++) {
      const d = predData[i];
      const dateIdx = overlapStart + i;
      const time = dates[dateIdx] as Time;
      const item: CandlestickData<Time> = {
        time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      };
      predSeriesData.push(item);
      allData.push(item);
    }

    realSeriesRef.current?.setData(realSeriesData);
    predSeriesRef.current?.setData(predSeriesData);

    // 自适应时间轴并固定价格轴
    chartRef.current.timeScale().fitContent();
    chartRef.current.priceScale('right').applyOptions({ autoScale: false });
  }, [realData, predData, dates]);

  // 切换实际 K 线显隐
  useEffect(() => {
    if (realSeriesRef.current) {
      realSeriesRef.current.applyOptions({
        visible: showReal,
      });
    }
  }, [showReal]);

  // 切换预测 K 线显隐
  useEffect(() => {
    if (predSeriesRef.current) {
      predSeriesRef.current.applyOptions({
        visible: showPred,
      });
    }
  }, [showPred]);

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">K线走势与预测</span>
        <div className="flex items-center gap-3">
          {/* 实际 K 线切换按钮 + 红/绿色块图例 */}
          <div className="flex items-center gap-1">
            <ToggleButton
              label="实际K线"
              active={showReal}
              color="#DC2626"
              onClick={() => setShowReal((v) => !v)}
            />
            <div className="flex flex-col gap-0.5 ml-1">
              <div className="w-2.5 h-2.5 bg-rise rounded-sm" />
              <div className="w-2.5 h-2.5 bg-fall rounded-sm" />
            </div>
          </div>
          {/* 预测 K 线切换按钮 + 边框色块图例 */}
          <div className="flex items-center gap-1">
            <ToggleButton
              label="预测K线"
              active={showPred}
              color="#F87171"
              onClick={() => setShowPred((v) => !v)}
              hollow
            />
            <div className="flex flex-col gap-0.5 ml-1">
              <div className="w-2.5 h-2.5 border border-rise-light rounded-sm" />
              <div className="w-2.5 h-2.5 border border-fall-light rounded-sm" />
            </div>
          </div>
        </div>
      </div>
      {/* lightweight-charts 渲染容器 */}
      <div ref={containerRef} className="flex-1 min-h-0 min-w-0 rounded-lg" />
    </div>
  );
}