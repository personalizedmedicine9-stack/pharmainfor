'use client';

import { motion } from 'framer-motion';

interface EvidenceMeterProps {
  score: number;       // 0-100
  evidenceLevel: 'High' | 'Moderate' | 'Low';
  label?: string;
}

export default function EvidenceMeter({ score, evidenceLevel, label }: EvidenceMeterProps) {
  const levelConfig = {
    High: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', barColor: 'bg-emerald-500' },
    Moderate: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', barColor: 'bg-amber-500' },
    Low: { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', barColor: 'bg-rose-500' },
  };

  const config = levelConfig[evidenceLevel] || levelConfig.Low;

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-3`}>
      {label && <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</div>}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-bold ${config.color}`}>{evidenceLevel} Evidence</span>
            <span className={`text-lg font-black ${config.color}`}>{score}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, score)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-2 ${config.barColor} rounded-full`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
