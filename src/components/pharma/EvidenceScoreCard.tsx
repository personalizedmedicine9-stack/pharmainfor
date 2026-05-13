'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface EvidenceScoreCardProps {
  normalizedScore: number;
  evidenceLevel: string;
  confidence: string;
  confidenceReasoning?: string;
  breakdown: {
    studyTypeScore: number;
    journalQualityScore: number;
    validationScore: number;
    contradictionPenalty: number;
  };
}

export default function EvidenceScoreCard({ normalizedScore, evidenceLevel, confidence, confidenceReasoning, breakdown }: EvidenceScoreCardProps) {
  const levelColor = evidenceLevel === 'High' ? 'text-emerald-600' : evidenceLevel === 'Moderate' ? 'text-amber-600' : 'text-rose-600';
  const ringColor = evidenceLevel === 'High' ? 'stroke-emerald-500' : evidenceLevel === 'Moderate' ? 'stroke-amber-500' : 'stroke-rose-500';
  const bgColor = evidenceLevel === 'High' ? 'bg-emerald-50' : evidenceLevel === 'Moderate' ? 'bg-amber-50' : 'bg-rose-50';

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${bgColor} border-gray-200`}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              className={ringColor}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-black ${levelColor} tracking-tight`}>{normalizedScore}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              evidenceLevel === 'High' ? 'bg-emerald-200 text-emerald-800' :
              evidenceLevel === 'Moderate' ? 'bg-amber-200 text-amber-800' :
              'bg-rose-200 text-rose-800'
            }`}>
              {evidenceLevel} Evidence
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              confidence === 'Strong' ? 'bg-emerald-200 text-emerald-800' :
              confidence === 'Moderate' ? 'bg-amber-200 text-amber-800' :
              'bg-rose-200 text-rose-800'
            }`}>
              {confidence} Confidence
            </span>
            {confidenceReasoning && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="w-4 h-4 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Confidence reasoning"
                  >
                    <Info size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left">
                  {confidenceReasoning}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Study Type</span>
              <span className="font-extrabold data-point">{breakdown.studyTypeScore}/40</span>
            </div>
            <div className="flex justify-between">
              <span>Journal Quality</span>
              <span className="font-extrabold data-point">{breakdown.journalQualityScore}/20</span>
            </div>
            <div className="flex justify-between">
              <span>Validation</span>
              <span className="font-extrabold data-point">{breakdown.validationScore}/20</span>
            </div>
            {breakdown.contradictionPenalty > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Contradiction</span>
                <span className="font-extrabold data-point text-rose-600">-{breakdown.contradictionPenalty}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
