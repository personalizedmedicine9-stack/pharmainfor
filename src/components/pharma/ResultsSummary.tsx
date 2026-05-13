'use client';

import { AlertTriangle, Database, FileText, Globe } from 'lucide-react';
import type { StudyResult, FdaDrugData } from '@/lib/types';

interface ResultsSummaryProps {
  results: StudyResult[];
  drug: string;
  herb: string;
  sourcesUsed: string[];
  fdaData: FdaDrugData | null;
  topCitationCount: number;
  fromCache: boolean;
}

export default function ResultsSummary({ results, sourcesUsed, fdaData, topCitationCount, fromCache }: ResultsSummaryProps) {
  const highCount = results.filter(r => r.evidenceLevel === 'High').length;
  const modCount = results.filter(r => r.evidenceLevel === 'Moderate').length;
  const lowCount = results.filter(r => r.evidenceLevel === 'Low').length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Analysis Results</h2>
        {fromCache && <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">Served from Cache</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-blue-600" size={18} />
            <h3 className="font-extrabold text-gray-800 text-sm">Data Sources</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sourcesUsed.map((source) => (
              <span key={source} className="px-2.5 py-0.5 bg-white border border-gray-200 text-xs font-semibold rounded-md text-gray-600">
                {source}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-violet-600" size={18} />
            <h3 className="font-extrabold text-gray-800 text-sm">Studies Found</h3>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{results.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">
            <span className="text-emerald-600">{highCount} High</span> · <span className="text-amber-600">{modCount} Mod</span> · <span className="text-rose-600">{lowCount} Low</span>
          </p>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="text-emerald-600" size={18} />
            <h3 className="font-extrabold text-gray-800 text-sm">Top Citations</h3>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{topCitationCount.toLocaleString()}</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Highest citation count</p>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-amber-600" size={18} />
            <h3 className="font-extrabold text-gray-800 text-sm">FDA Signal</h3>
          </div>
          <p className="text-sm font-extrabold text-gray-900">{fdaData ? 'Detected' : 'None'}</p>
          {fdaData && fdaData.brandNames.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{fdaData.brandNames.slice(0, 2).join(', ')}</p>
          )}
        </div>
      </div>

      {fdaData && (
        <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-extrabold text-amber-900 text-sm">FDA-Associated Safety Signal</h4>
            <p className="text-[13px] text-amber-800 mt-1 leading-relaxed">Potential interaction-related safety signals were identified from FDA-associated pharmacovigilance data; however, clinical significance and causality remain incompletely established.</p>
          </div>
        </div>
      )}
    </div>
  );
}
