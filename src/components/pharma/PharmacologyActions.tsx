'use client';

import { FlaskConical, Leaf, CheckCircle } from 'lucide-react';

interface PharmacologyActionsProps {
  actions: { name: string; pmids: string[]; score: number; mechanisms: { name: string; pmids: string[] }[] }[];
}

export default function PharmacologyActions({ actions }: PharmacologyActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
      {actions.map((action, index) => {
        const scorePercent = Math.min(100, action.score);
        const scoreColor = action.score >= 80 ? 'text-emerald-600' : action.score >= 50 ? 'text-amber-600' : 'text-gray-500';
        const ringColor = action.score >= 80 ? 'stroke-emerald-500' : action.score >= 50 ? 'stroke-amber-500' : 'stroke-gray-400';

        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (scorePercent / 100) * circumference;

        return (
          <div key={index} className="bg-white border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-4">
              {/* Score circle */}
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle
                    cx="28" cy="28" r={radius} fill="none"
                    className={ringColor}
                    strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-black ${scoreColor}`}>{action.score}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium capitalize">
                    {action.name}
                  </span>
                  <CheckCircle size={14} className="text-emerald-500" />
                </div>

                {action.pmids.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {action.pmids.map(pmid => (
                      <a
                        key={pmid}
                        href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-emerald-700 hover:text-emerald-900"
                      >
                        PMID:{pmid}
                      </a>
                    ))}
                  </div>
                )}

                {action.mechanisms.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {action.mechanisms.map((mech, mi) => (
                      <div key={mi} className="border-l-2 border-blue-200 pl-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500">Mechanism:</span>
                          <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 rounded text-xs text-blue-800 uppercase">{mech.name}</span>
                          {mech.pmids.length > 0 && (
                            <div className="flex gap-1">
                              {mech.pmids.slice(0, 2).map(pmid => (
                                <a key={pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noreferrer" className="text-xs underline text-blue-700">PMID:{pmid}</a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
