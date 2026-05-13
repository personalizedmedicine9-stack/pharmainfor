'use client';

import { Clock, FlaskConical, Leaf, ChevronRight } from 'lucide-react';

interface SearchHistoryItem {
  id: string;
  query: string;
  engineType: string;
  resultsCount: number;
  sourcesUsed: string[];
  topCitationCount: number;
  hasFdaData: boolean;
  timestamp: string;
}

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onRerun: (query: string) => void;
}

export default function SearchHistory({ history, onRerun }: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
        <Clock size={12} />
        Recent Searches
      </h3>
      <div className="flex flex-wrap gap-2">
        {history.slice(0, 3).map((entry) => (
          <button
            key={entry.id}
            onClick={() => onRerun(entry.query)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-white rounded-lg text-xs text-slate-600 font-medium transition-all group"
          >
            <FlaskConical size={11} className="text-slate-400 group-hover:text-slate-600" />
            <span>{entry.query}</span>
            <span className="text-slate-300 text-[10px]">({entry.resultsCount})</span>
            <ChevronRight size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
