'use client';

import { motion } from 'framer-motion';
import { FlaskConical, Leaf, Search, Zap, AlertTriangle, CheckCircle, FileText, Bookmark, BookmarkCheck, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import type { PharmacologyResponse, PharmacologyAction, SpellingCorrection } from '@/lib/types';
import { EXAMPLE_HERBS } from '@/lib/knowledge-base';
import { PharmacologyPDFDownloadLink } from '@/lib/pdf-export';

interface PharmacologyEngineProps {
  onSearch: (herb: string) => Promise<PharmacologyResponse | null>;
  onSignInRequired: () => void;
}

const EVIDENCE_STYLES: Record<string, string> = {
  High: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Moderate: 'bg-amber-100 text-amber-800 border border-amber-200',
  Low: 'bg-rose-100 text-rose-800 border border-rose-200',
  'No Evidence': 'bg-slate-100 text-slate-500 border border-slate-200',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  High: 'bg-blue-100 text-blue-800 border border-blue-200',
  Moderate: 'bg-sky-100 text-sky-800 border border-sky-200',
  Low: 'bg-slate-100 text-slate-500 border border-slate-200',
};

export default function PharmacologyEngine({ onSearch, onSignInRequired }: PharmacologyEngineProps) {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [herb, setHerb] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PharmacologyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [spellingCorrection, setSpellingCorrection] = useState<SpellingCorrection | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [confidenceReasoning, setConfidenceReasoning] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (herbName: string) => {
    if (!herbName.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(false);
    setSummary(null);
    setHerb(herbName);

    setSpellingCorrection(null);
    setReportSaved(false);
    setConfidenceReasoning(null);

    try {
      const data = await onSearch(herbName.trim());
      if (!data) {
        setError('Search failed. Please try again.');
      } else {
        setResult(data);
        // Extract spelling correction from response
        if (data.spellingCorrection) {
          setSpellingCorrection(data.spellingCorrection);
        }
        // Extract confidence reasoning
        if (data.confidenceReasoning) {
          setConfidenceReasoning(data.confidenceReasoning);
        }
      }
    } catch {
      setError('Search failed. Please try again.');
    }

    setLoading(false);
    setSearched(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(herb);
  };

  const handleSummary = async () => {
    if (!result || result.pharmacological_actions.length === 0) return;
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pharmacology', data: result.pharmacological_actions, herb: result.herb }),
      });
      const data = await res.json();
      if (data.text) setSummary(data.text);
    } catch {
      // ignore
    }
    setLoadingSummary(false);
  };

  // Deduplicate actions by name (only use unique entries)
  const seenActionNames = new Set<string>();
  const actions: PharmacologyAction[] = (result?.pharmacological_actions || [])
    .filter(item => {
      const key = item.name.toLowerCase();
      if (seenActionNames.has(key)) return false;
      seenActionNames.add(key);
      return true;
    })
    .map(item => ({
      name: item.name || 'Uncharacterized pharmacological action',
      pmids: item.pmids || [],
      score: item.score || 0,
      // Deduplicate mechanisms within each action
      mechanisms: (() => {
        const seenMechNames = new Set<string>();
        return (item.mechanisms || [])
          .filter(m => {
            const mechKey = (typeof m === 'string' ? m : m.name).toLowerCase();
            if (seenMechNames.has(mechKey)) return false;
            seenMechNames.add(mechKey);
            return true;
          })
          .map(m => ({
            name: typeof m === 'string' ? m : m.name || 'Additional mechanistic pathway',
            pmids: typeof m === 'string' ? [] : m.pmids || [],
          }));
      })(),
    }));

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-5 md:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-slate-800">Pharmacology & Phytochemistry</h2>
            <p className="text-slate-500 text-xs md:text-sm">Enter a natural product to explore its pharmacological profile and phytochemical composition from PubMed</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-600 uppercase tracking-wide">
              <Leaf size={15} className="text-emerald-500" />
              Natural Product Name
            </label>
            <input
              type="text"
              value={herb}
              onChange={(e) => setHerb(e.target.value)}
              placeholder="e.g. Turmeric, Ginkgo biloba, St. John's Wort…"
              required
              className="w-full px-4 py-3 md:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm md:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!mounted || loading || !herb.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 md:py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] text-sm md:text-base"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Pharmacology Report…
              </>
            ) : (
              <>
                <Search size={18} />
                Generate Pharmacology Report
              </>
            )}
          </button>
        </form>

        <div className="mt-5">
          <p className="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick examples</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_HERBS.map((h) => (
              <button
                key={h}
                onClick={() => handleSubmit(h)}
                className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
              >
                <Leaf size={12} className="text-emerald-400" />
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertTriangle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-rose-700 text-sm md:text-base">{error}</p>
        </motion.div>
      )}

      {/* Results — SINGLE RENDERING ONLY */}
      {searched && result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-5 md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FlaskConical size={18} className="text-emerald-600" />
                  <h3 className="text-base md:text-lg font-extrabold text-slate-800">{result.herb}</h3>
                </div>
                <p className="text-slate-500 text-xs md:text-sm">Pharmacological profile — PubMed literature analysis</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${EVIDENCE_STYLES[result.evidence_level]}`}>
                  {result.evidence_level} Evidence
                </span>
                <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${CONFIDENCE_STYLES[result.confidence]}`}>
                  {result.confidence} Confidence
                </span>
                {result.sourcesUsed?.length > 0 && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-bold bg-emerald-600 text-white">
                    <Zap size={10} /> PubMed
                  </span>
                )}
              </div>
            </div>

            {/* Spelling Correction — "Showing results for [Canonical]" */}
            {spellingCorrection && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs md:text-sm text-amber-800 font-medium">
                  {spellingCorrection.wasAutoCorrected
                    ? <>Corrected <strong>{spellingCorrection.original}</strong> to <strong>{spellingCorrection.canonical || spellingCorrection.corrected}</strong></>
                    : <>Showing results for <strong>{spellingCorrection.canonical || spellingCorrection.corrected}</strong></>
                  }
                  {spellingCorrection.synonymApplied && spellingCorrection.canonical && (
                    <span className="text-amber-600 ml-1 text-xs">(scientific synonym)</span>
                  )}
                </p>
              </div>
            )}

            {/* Confidence Reasoning */}
            {confidenceReasoning && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider mb-1">Confidence Assessment</h4>
                <p className="text-[13px] md:text-sm text-blue-900 leading-relaxed analysis-text">{confidenceReasoning}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={handleSummary}
                disabled={loadingSummary}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg"
              >
                {loadingSummary ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Pharmacology Report…</>
                ) : (
                  'Generate Pharmacology Report'
                )}
              </button>
              <PharmacologyPDFDownloadLink
                result={result}
                aiSummary={summary}
              >
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 hover:border-gray-900 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                  <FileText size={16} /> Export PDF
                </button>
              </PharmacologyPDFDownloadLink>
              <button
                onClick={async () => {
                  if (!isAuthenticated) {
                    onSignInRequired();
                    return;
                  }
                  try {
                    const res = await fetch('/api/saved-reports', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        reportId: `pharmacology_${result.herb}_${Date.now()}`,
                        reportType: 'pharmacology',
                        herbName: result.herb,
                        reportData: result,
                        userId: user?.id,
                        authMode: user?.authMode || 'local',
                      }),
                    });
                    if (res.ok) {
                      setReportSaved(true);
                      toast.success('Report saved successfully!');
                    } else {
                      toast.error('Failed to save report. Please try again.');
                    }
                  } catch {
                    toast.error('Network error. Please try again.');
                  }
                }}
                disabled={reportSaved}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 hover:border-emerald-500 disabled:border-emerald-400 rounded-xl text-sm font-bold text-gray-700 hover:text-emerald-700 disabled:text-emerald-600 transition-all shadow-sm"
              >
                {reportSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                {reportSaved ? 'Saved' : 'Save Report'}
              </button>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 md:p-4 mb-4">
                <h4 className="text-xs md:text-sm font-extrabold text-emerald-800 uppercase tracking-wider mb-2">Evidence Synthesis</h4>
                <div className="text-emerald-900 text-[13px] md:text-sm leading-relaxed whitespace-pre-line">{summary}</div>
              </div>
            )}

            {/* No evidence */}
            {result.evidence_level === 'No Evidence' && (
              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <AlertTriangle size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-500 text-sm md:text-base">{result.noEvidenceMessage || 'No pharmacological evidence found in PubMed for this herb.'}</p>
              </div>
            )}

            {/* Active Compounds */}
            {result.active_compounds.length === 0 && result.evidence_level !== 'No Evidence' && (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-500 italic">
                No validated active compounds identified from current evidence.
              </div>
            )}
            {result.active_compounds.length > 0 && result.evidence_level !== 'No Evidence' && (
              <div className="mb-4">
                <h4 className="text-[13px] md:text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-3">Active Compounds</h4>
                <div className="flex flex-wrap gap-2">
                  {result.active_compounds.filter(c => !['Flavonoids', 'Alkaloids', 'Terpenes', 'Tannins', 'Essential Oils'].includes(c.name)).map((comp, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-xs md:text-sm text-emerald-800 font-medium">{comp.name}</span>
                      <span className="text-[11px] md:text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">{comp.category}</span>
                      {comp.pmids.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-1">
                          {comp.pmids.slice(0, 2).map(pmid => (
                            <a key={pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noreferrer" className="text-[11px] md:text-xs underline text-emerald-700">PMID:{pmid}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pharmacological Actions — SINGLE RENDER ONLY (no duplicate) */}
            {result.evidence_level !== 'No Evidence' && actions.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span className="font-bold text-emerald-800 text-[13px] md:text-base">Pharmacological Actions & Mechanisms</span>
                </div>

                <div className="space-y-3 max-h-[24rem] md:max-h-96 overflow-y-auto">
                  {actions.map((action, index) => (
                    <div key={`${action.name}-${index}`} className="bg-white border border-emerald-200 rounded-xl p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2 md:px-2.5 py-1 bg-emerald-100 border border-emerald-200 rounded-lg text-[13px] md:text-sm text-emerald-800 font-medium capitalize">{action.name}</span>
                        {action.score > 0 && (
                          <span className={`px-2 py-0.5 rounded text-[11px] md:text-xs font-bold ${
                            action.score >= 80 ? 'bg-emerald-200 text-emerald-800' :
                            action.score >= 50 ? 'bg-amber-200 text-amber-800' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            Score: {action.score}
                          </span>
                        )}
                        {action.pmids.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {action.pmids.map(pmid => (
                              <a key={pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noreferrer" className="text-[11px] md:text-xs underline text-emerald-700">PMID:{pmid}</a>
                            ))}
                          </div>
                        )}
                      </div>

                      {action.mechanisms.length > 0 && (
                        <div className="mt-2 ml-2 space-y-1.5">
                          {action.mechanisms.map((mech, mechIndex) => (
                            <div key={`${mech.name}-${mechIndex}`} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] md:text-[13px] text-slate-500">Mechanism:</span>
                                <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 rounded text-[11px] md:text-[13px] text-blue-800">{mech.name}</span>
                                {mech.pmids.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {mech.pmids.slice(0, 2).map(pmid => (
                                      <a key={pmid} href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`} target="_blank" rel="noreferrer" className="text-[11px] md:text-xs underline text-blue-700">PMID:{pmid}</a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


        </motion.div>
      )}
    </div>
  );
}
