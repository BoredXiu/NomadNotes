import { useState, useEffect, useRef } from 'react';
import type { TabsProps } from 'antd';

/**
 * 滑板样式 TabBar 指示器组件
 * 替代默认蓝色横杆，提供滑板翘头动画效果
 * 滑板往哪边滑，头就往哪边翘
 */
const SkateboardTabBar: React.FC<{
  activeKey: string;
  onChange: (key: string) => void;
  items: NonNullable<TabsProps['items']>;
}> = ({ activeKey, onChange, items }) => {
  const [animating, setAnimating] = useState(false);
  const [tiltDir, setTiltDir] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(0);

  // 获取当前激活项的索引
  const currentIndex = items.findIndex((item) => item.key === activeKey);

  // 计算指示器位置
  useEffect(() => {
    if (!containerRef.current) return;
    const tabs = containerRef.current.querySelectorAll('[data-tab-key]');
    tabs.forEach((tab) => {
      const key = tab.getAttribute('data-tab-key');
      if (key === activeKey && indicatorRef.current) {
        const tabRect = tab.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        indicatorRef.current.style.transform = `translateX(${tabRect.left - containerRect.left}px)`;
        indicatorRef.current.style.width = `${tabRect.width}px`;
      }
    });
  }, [activeKey, items]);

  const handleClick = (key: string) => {
    if (key === activeKey) return;
    const newIndex = items.findIndex((item) => item.key === key);
    // 判断滑动方向：索引变大 = 向右滑，索引变小 = 向左滑
    const dir = newIndex > prevIndexRef.current ? 'right' : 'left';
    prevIndexRef.current = newIndex;
    setTiltDir(dir);
    setAnimating(true);
    onChange(key);
    // 动画结束后复位
    setTimeout(() => {
      setAnimating(false);
      setTiltDir(null);
    }, 400);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        borderBottom: '2px solid #f0f0f0',
        marginBottom: 16,
      }}
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <div
            key={item.key}
            data-tab-key={item.key}
            onClick={() => handleClick(item.key as string)}
            style={{
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#1890ff' : '#666',
              position: 'relative',
              userSelect: 'none',
              transition: 'color 0.3s ease',
            }}
          >
            {item.label}
          </div>
        );
      })}

      {/* 滑板指示器 */}
      <div
        ref={indicatorRef}
        style={{
          position: 'absolute',
          bottom: -2,
          height: 18,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: activeKey ? 1 : 0,
        }}
      >
        <div
          style={{
            transform: animating
              ? tiltDir === 'right'
                ? 'rotate(-12deg) translateY(-3px) scale(1.05)'
                : 'rotate(12deg) translateY(-3px) scale(1.05)'
              : 'rotate(0deg) translateY(0) scale(1)',
            transformOrigin: 'bottom center',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <SkateboardSVG />
        </div>
      </div>
    </div>
  );
};

/**
 * 滑板 SVG 图标 - 精致小巧风格
 */
const SkateboardSVG: React.FC = () => (
  <svg
    width="60"
    height="22"
    viewBox="0 0 60 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    {/* 板面主体 - 微翘两端 */}
    <path
      d="M6 7 C6 9, 10 10, 30 10 C50 10, 54 9, 54 7 L52 5 C52 7, 48 8, 30 8 C12 8, 8 7, 8 5 Z"
      fill="#1890ff"
      stroke="#096dd9"
      strokeWidth="0.5"
    />
    {/* 板面高光 */}
    <path
      d="M10 7 C10 8, 14 9, 30 9 C46 9, 50 8, 50 7"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1"
      fill="none"
      strokeLinecap="round"
    />
    {/* 左支架 */}
    <rect x="16" y="12" width="10" height="2" rx="0.5" fill="#8c8c8c" />
    {/* 右支架 */}
    <rect x="34" y="12" width="10" height="2" rx="0.5" fill="#8c8c8c" />
    {/* 左轮 */}
    <circle cx="21" cy="17" r="3.5" fill="#434343" />
    <circle cx="21" cy="17" r="1.5" fill="#8c8c8c" />
    {/* 右轮 */}
    <circle cx="39" cy="17" r="3.5" fill="#434343" />
    <circle cx="39" cy="17" r="1.5" fill="#8c8c8c" />
  </svg>
);

export default SkateboardTabBar;
