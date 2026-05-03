/** 根布局：设置页面元数据与全局语言。 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'A股K线预测',
  description: '基于Kronos模型的A股K线走势预测',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
