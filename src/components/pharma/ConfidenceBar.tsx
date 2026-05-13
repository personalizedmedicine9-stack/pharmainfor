'use client';

import { motion } from 'framer-motion';

interface ConfidenceBarProps {
  value: number;       // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: { height: 'h-1.5', text: 'text-[10px]', container: 'w-24' },
  md: { height: 'h-2.5', text: 'text-xs', container: 'w-32' },
  lg: { height: 'h-4', text: 'text-sm', container: 'w-full' },
};

export default function ConfidenceBar({ value, label, showPercentage = true, size = 'md' }: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const sizeConfig = SIZE_MAP[size];

  const barColor = clamped >= 70
    ? 'bg-emerald-500'
    : clamped >= 40
    ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className="flex items-center gap-2">
      {label && <span className={`${sizeConfig.text} font-semibold text-gray-600`}>{label}</span>}
      <div className={`${sizeConfig.container} ${sizeConfig.height} bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`${sizeConfig.height} ${barColor} rounded-full`}
        />
      </div>
      {showPercentage && (
        <span className={`${sizeConfig.text} font-bold ${clamped >= 70 ? 'text-emerald-600' : clamped >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
          {clamped}%
        </span>
      )}
    </div>
  );
}
