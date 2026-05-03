/**
 * 切换按钮组件：用于 K 线图上切换实际/预测系列的显隐。
 * 激活时显示指定颜色圆点，未激活时灰显。
 */
'use client';

interface ToggleButtonProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  hollow?: boolean;
}

export default function ToggleButton({ label, active, color, onClick, hollow }: ToggleButtonProps) {
  const dotStyle = hollow
    ? { borderColor: active ? color : '#94A3B8', backgroundColor: 'transparent' }
    : { backgroundColor: active ? color : '#94A3B8' };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border transition-colors ${
        active ? 'border-border-subtle opacity-100' : 'border-border-subtle opacity-40'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${hollow ? 'border-2' : ''}`}
        style={dotStyle}
      />
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </button>
  );
}