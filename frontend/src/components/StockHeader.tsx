/**
 * 股票头部信息组件：展示股票名称、代码、当前价格与涨跌幅。
 * 涨幅为正时显示红色（rise），跌幅为负时显示绿色（fall）。
 */
'use client';

interface StockHeaderProps {
  name: string;
  code: string;
  price: number;
  change: string;
}

export default function StockHeader({ name, code, price, change }: StockHeaderProps) {
  // 以 "+" 开头表示上涨
  const isUp = change.startsWith('+');
  const formattedPrice = price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="w-full flex items-end justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
        <span className="text-sm text-text-muted font-mono">{code}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[28px] font-bold text-text-primary font-mono leading-tight">
          {formattedPrice}
        </span>
        <span className={`text-sm font-mono ${isUp ? 'text-rise' : 'text-fall'}`}>{change}</span>
      </div>
    </div>
  );
}
