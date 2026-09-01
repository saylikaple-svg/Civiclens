import React, { useEffect, useState } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtext1: string;
  subtext2?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'amber';
  delay?: number;
}

// Smooth count-up animation hook
export const useCountUp = (target: number, duration: number = 800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * target);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return count;
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext1,
  subtext2,
  icon,
  color,
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
  const animatedNumber = useCountUp(numericValue, 1000);

  // Formatted display
  const displayValue = typeof value === 'number'
    ? Math.round(animatedNumber).toLocaleString('en-IN')
    : value;

  const colorMap = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-600 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-blue-500/10',
      glow: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-emerald-500/10',
      glow: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50',
    },
    red: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      hoverBorder: 'hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-rose-500/10',
      glow: 'group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50',
    },
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-amber-500/10',
      glow: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-950/50',
      text: 'text-amber-700 dark:text-amber-300',
      hoverBorder: 'hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-amber-500/10',
      glow: 'group-hover:bg-amber-200 dark:group-hover:bg-amber-900/60',
    },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`group bg-gov-card border border-gov-border rounded-xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex items-start space-x-4 cursor-pointer relative overflow-hidden ${selectedColor.hoverBorder}`}
    >
      {/* Top subtle highlight shimmer on hover */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gov-gold"></div>

      {/* Icon Circle with Hover Bounce / Rotate Effect */}
      <div
        className={`p-3.5 rounded-xl ${selectedColor.bg} ${selectedColor.text} ${selectedColor.glow} flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}
      >
        {icon}
      </div>

      {/* Metric details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-serif tracking-wider text-gov-muted uppercase truncate mb-1 group-hover:text-gov-navy transition-colors">
          {title}
        </h4>
        <div className="text-2xl font-bold font-serif text-gov-navy leading-none mb-1.5 tracking-tight group-hover:scale-105 origin-left transition-transform duration-200">
          {displayValue}
        </div>
        <p className="text-xs text-gov-muted font-sans font-medium leading-normal truncate">
          {subtext1}
        </p>
        {subtext2 && (
          <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-none">
            {subtext2}
          </p>
        )}
      </div>
    </div>
  );
};
