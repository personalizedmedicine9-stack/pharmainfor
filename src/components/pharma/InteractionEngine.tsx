'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FlaskConical, Leaf, Info, Microscope, Beaker, AlertTriangle, FileText, Sparkles, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import StudyCard from './StudyCard';
import ResultsSummary from './ResultsSummary';
import FilterBar, { type SortType } from './FilterBar';
import SearchHistoryComp from './SearchHistory';
import EvidenceScoreCard from './EvidenceScoreCard';
import SearchSkeleton from './SearchSkeleton';
import type { StudyResult, FdaDrugData, SearchHistoryEntry, SpellingCorrection } from '@/lib/types';
import { API_SOURCES, EXAMPLE_SEARCHES } from '@/lib/knowledge-base';
import { scoreEvidenceSet, type EvidenceInput } from '@/lib/evidence-scoring';
import { InteractionPDFDownloadLink } from '@/lib/pdf-export';

type FilterType = 'All' | 'High' | 'Moderate' | 'Low';
const EVIDENCE_RANK: Record<string, number> = { High: 0, Moderate: 1, Low: 2 };
const JOURNAL_RANK: Record<string, number> = { 'High-impact journal': 0, 'Medium-impact journal': 1, 'Low/uncertain quality': 2 };

interface InteractionEngineProps {
  history: SearchHistoryEntry[];
  onHistoryUpdate: () => void;
  onSignInRequired: () => void;
}

export default function InteractionEngine({ history, onHistoryUpdate, onSignInRequired }: InteractionEngineProps) {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [drug, setDrug] = useState('');
  const [herb, setHerb] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StudyResult[]>([]);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [fdaData, setFdaData] = useState<FdaDrugData | null>(null);
  const [topCitationCount, setTopCitationCount] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [lastDrug, setLastDrug] = useState('');
  const [lastHerb, setLastHerb] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('relevance');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [evidenceScores, setEvidenceScores] = useState<ReturnType<typeof scoreEvidenceSet>>([]);
  const [spellingCorrections, setSpellingCorrections] = useState<{ drug: SpellingCorrection | null; herb: SpellingCorrection | null } | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [confidenceReasoning, setConfidenceReasoning] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const handleSearch = async (drugName: string, herbName: string) => {
    if (!drugName.trim() || !herbName.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(false);
    setFilter('All');
    setSort('relevance');
    setFdaData(null);
    setSourcesUsed([]);
    setFromCache(false);
    setSummary(null);
    setSummaryError(null);
    setEvidenceScores([]);
    setSpellingCorrections(null);
    setReportSaved(false);
    setConfidenceReasoning(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drug: drugName.trim(), herb: herbName.trim() }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Error');
        return;
      }

      setResults(data.results);
      setSourcesUsed(data.sourcesUsed);
      setFdaData(data.fdaData);
      setTopCitationCount(data.topCitationCount);
      setFromCache(data.fromCache ?? false);
      setLastDrug(drugName.trim());
      setLastHerb(herbName.trim());
      setHasSearched(true);

      if (data.spellingCorrections) {
        setSpellingCorrections(data.spellingCorrections);
      }

      // Store confidence reasoning
      if (data.confidenceReasoning) {
        setConfidenceReasoning(data.confidenceReasoning);
      }

      // Compute evidence scores
      if (data.results.length > 0) {
        const inputs: EvidenceInput[] = data.results.map((r: StudyResult) => ({
          studyType: r.studyType,
          title: r.title,
          abstract: r.abstract,
          journal: r.journal,
          citationCount: r.citationCount,
        }));
        setEvidenceScores(scoreEvidenceSet(inputs));
      }

      // Save search history
      try {
        await fetch('/api/search-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `${drugName.trim()} + ${herbName.trim()}`,
            engineType: 'interaction',
            resultsCount: data.results.length,
            sourcesUsed: data.sourcesUsed,
            topCitationCount: data.topCitationCount,
            hasFdaData: !!data.fdaData,
          }),
        });
        onHistoryUpdate();
      } catch { /* ignore */ }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummary = async () => {
    if (sortedFiltered.length === 0) return;
    setLoadingSummary(true);
    setSummaryError(null);
    setSummary(null);

    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'interaction',
          data: sortedFiltered.slice(0, 10).map(s => ({
            pmid: s.pmid,
            title: s.title,
            abstract: s.abstract,
            evidenceLevel: s.evidenceLevel,
            studyType: s.studyType,
          })),
          drug: lastDrug,
          herb: lastHerb,
        }),
      });
      const data = await res.json();
      if (data.text) setSummary(data.text);
      else setSummaryError('Failed to generate summary.');
    } catch {
      setSummaryError('Network error generating summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const sortedFiltered = useMemo(() =>
    results
      .filter(r => filter === 'All' || r.evidenceLevel === filter)
      .slice()
      .sort((a, b) => {
        switch (sort) {
          case 'citations': return b.citationCount - a.citationCount;
          case 'evidence': return EVIDENCE_RANK[a.evidenceLevel] - EVIDENCE_RANK[b.evidenceLevel];
          case 'journal': return JOURNAL_RANK[a.journalQuality] - JOURNAL_RANK[b.journalQuality];
          case 'year': return (parseInt(b.pubYear) || 0) - (parseInt(a.pubYear) || 0);
          case 'relevance': return b.relevanceScore - a.relevanceScore;
          default: return b.compositeScore - a.compositeScore;
        }
      }),
    [results, filter, sort]
  );

  const handleHistoryRerun = (query: string) => {
    const parts = query.split(' + ');
    if (parts.length === 2) {
      setDrug(parts[0].trim());
      setHerb(parts[1].trim());
      handleSearch(parts[0].trim(), parts[1].trim());
    }
  };

  return (
    <div>
      {/* Search form section */}
      <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-5 md:p-8 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {API_SOURCES.map((s) => (
            <div key={s.name} className="bg-gray-50/80 border border-gray-200 p-3 md:p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                <span className="text-xs md:text-sm font-bold text-gray-900">{s.name}</span>
              </div>
              <p className="text-[11px] md:text-xs text-gray-500 pl-4 font-medium">{s.desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(drug, herb); }} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-600 uppercase tracking-wide">
                <FlaskConical size={15} className="text-red-500" />
                Drug Name
              </label>
              <input
                type="text"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                placeholder="Enter any drug name…"
                required
                className="w-full px-4 py-3 md:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm md:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm md:text-base font-semibold text-slate-600 uppercase tracking-wide">
                <Leaf size={15} className="text-emerald-500" />
                Natural Product Name
              </label>
              <input
                type="text"
                value={herb}
                onChange={(e) => setHerb(e.target.value)}
                placeholder="Enter any Natural Product Name…"
                required
                className="w-full px-4 py-3 md:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm md:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!mounted || loading || !drug.trim() || !herb.trim()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 md:py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] text-sm md:text-base"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search size={18} />
                Generate Evidence Synthesis
              </>
            )}
          </button>
        </form>

        <div className="mt-4 md:mt-6 bg-gray-900 border border-gray-800 p-4 md:p-5 rounded-xl shadow-xl">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-white mt-0.5 flex-shrink-0" />
            <div className="text-[13px] md:text-sm text-gray-300 leading-relaxed">
              <span className="font-extrabold text-white">Clinical Protocol: </span>
              Enter <strong className="text-white">Generic Drug Name</strong> (e.g., Warfarin) and <strong className="text-white">Natural Product Name</strong> (e.g., Garlic). The engine queries overlapping literature, resolves DOIs, retrieves citations, and identifies FDA-associated safety signals.
            </div>
          </div>
        </div>

        <SearchHistoryComp history={history} onRerun={handleHistoryRerun} />
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mb-6">
          <SearchSkeleton />
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm mb-6">
            <AlertTriangle size={18} className="text-red-600 mt-0.5" />
            <p className="text-red-800 text-sm font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spelling Corrections — "Showing results for [Canonical]" */}
      <AnimatePresence>
        {spellingCorrections && (spellingCorrections.drug || spellingCorrections.herb) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm mb-4">
            <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 font-medium space-y-1">
              {spellingCorrections.drug && (
                <p>
                  {spellingCorrections.drug.wasAutoCorrected
                    ? <>Corrected <strong>{spellingCorrections.drug.original}</strong> to <strong>{spellingCorrections.drug.canonical || spellingCorrections.drug.corrected}</strong></>
                    : <>Showing results for <strong>{spellingCorrections.drug.canonical || spellingCorrections.drug.corrected}</strong></>
                  }
                  {spellingCorrections.drug.synonymApplied && spellingCorrections.drug.canonical && (
                    <span className="text-amber-600 ml-1 text-xs">(scientific synonym)</span>
                  )}
                </p>
              )}
              {spellingCorrections.herb && (
                <p>
                  {spellingCorrections.herb.wasAutoCorrected
                    ? <>Corrected <strong>{spellingCorrections.herb.original}</strong> to <strong>{spellingCorrections.herb.canonical || spellingCorrections.herb.corrected}</strong></>
                    : <>Showing results for <strong>{spellingCorrections.herb.canonical || spellingCorrections.herb.corrected}</strong></>
                  }
                  {spellingCorrections.herb.synonymApplied && spellingCorrections.herb.canonical && (
                    <span className="text-amber-600 ml-1 text-xs">(scientific synonym)</span>
                  )}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mechanism Description — deduplicated */}
      {hasSearched && results.length > 0 && (() => {
        // Collect all mechanism parts, split by ';', and deduplicate
        const allParts = results
          .map(r => r.mechanismDescription)
          .filter((m): m is string => !!m && !m.includes('not fully characterized'))
          .flatMap(m => m.split('; '))
          .map(m => m.trim())
          .filter(m => m.length > 0);
        const uniqueMechanisms = [...new Set(allParts)];
        if (uniqueMechanisms.length === 0) return null;
        return (
          <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <h4 className="text-xs font-extrabold text-sky-800 uppercase tracking-wider mb-2">Identified Mechanisms</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueMechanisms.map((m, i) => (
                <span key={i} className="px-3 py-1.5 bg-sky-100 border border-sky-200 rounded-lg text-[13px] md:text-sm text-sky-800 font-medium">{m}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Results */}
      <AnimatePresence>
        {hasSearched && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <InteractionPDFDownloadLink
                results={results}
                drug={lastDrug}
                herb={lastHerb}
                sourcesUsed={sourcesUsed}
                fdaData={fdaData}
                topCitationCount={topCitationCount}
                aiSummary={summary}
                scores={evidenceScores}
                confidenceReasoning={confidenceReasoning}
              >
                <button className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-gray-300 hover:border-gray-900 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                  <FileText size={18} /> Export Interaction PDF
                </button>
              </InteractionPDFDownloadLink>
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
                        reportId: `interaction_${lastDrug}_${lastHerb}_${Date.now()}`,
                        reportType: 'interaction',
                        drugName: lastDrug,
                        herbName: lastHerb,
                        reportData: { results, sourcesUsed, fdaData, topCitationCount, summary, evidenceScores },
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
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-gray-300 hover:border-emerald-500 disabled:border-emerald-400 rounded-xl text-sm font-bold text-gray-700 hover:text-emerald-700 disabled:text-emerald-600 transition-all shadow-sm"
              >
                {reportSaved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                {reportSaved ? 'Report Saved' : 'Save Report'}
              </button>
              <button onClick={handleSummary} disabled={loadingSummary} className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:shadow-lg">
                {loadingSummary ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Evidence-Based Findings…</>
                ) : (
                  <><Sparkles size={18} /> Generate Evidence-Based Findings</>
                )}
              </button>
            </div>

            {/* Summary */}
            <AnimatePresence>
              {summary && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-rose-50 border border-rose-200 rounded-xl shadow-sm mb-6 overflow-hidden">
                  <div className="px-5 md:px-7 pt-5 pb-3 flex items-center gap-2 border-b border-rose-200">
                    <Sparkles size={18} className="text-rose-700" />
                    <h4 className="text-[13px] md:text-base font-extrabold text-gray-900 uppercase tracking-wider">Interaction Findings Summary</h4>
                  </div>
                  <div className="px-5 md:px-7 py-4 space-y-4">
                    {(() => {
                      const parts = summary.split(/Evidence Profile:/i);
                      const synthesisText = parts[0]?.trim() || '';
                      const profileText = parts[1]?.trim() || '';
                      return (
                        <>
                          <div className="text-black text-[13px] md:text-sm leading-relaxed font-medium">{synthesisText}</div>
                          {profileText && (
                            <div className="pt-3 border-t border-rose-200">
                              <div className="text-xs font-extrabold text-rose-800 uppercase tracking-wider mb-2">Evidence Profile</div>
                              <div className="text-black text-[13px] leading-relaxed whitespace-pre-line font-mono">{profileText}</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {summaryError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                <p className="text-red-700 text-sm font-bold">{summaryError}</p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-300 shadow-xl p-5 md:p-8">
              <ResultsSummary results={results} drug={lastDrug} herb={lastHerb} sourcesUsed={sourcesUsed} fdaData={fdaData} topCitationCount={topCitationCount} fromCache={fromCache} />

              {/* Confidence Reasoning */}
              {confidenceReasoning && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider mb-2">Confidence Assessment</h4>
                  <p className="text-[13px] md:text-sm text-blue-900 leading-relaxed analysis-text">{confidenceReasoning}</p>
                </div>
              )}

              {/* Evidence Score Cards */}
              {evidenceScores.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[13px] md:text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-3">Weighted Evidence Scoring</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evidenceScores.slice(0, 4).map((score, i) => (
                      <EvidenceScoreCard
                        key={i}
                        normalizedScore={score.normalizedScore}
                        evidenceLevel={score.evidenceLevel}
                        confidence={score.confidenceCategory}
                        breakdown={score.breakdown}
                        confidenceReasoning={score.rationale}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <FilterBar results={results} filter={filter} sort={sort} onFilterChange={setFilter} onSortChange={setSort} />
              </div>

              <div className="space-y-4">
                {sortedFiltered.map((study, i) => (
                  <StudyCard key={study.pmid} study={study} index={i} />
                ))}
                {sortedFiltered.length === 0 && (
                  <div className="text-center py-12 md:py-16 px-4 bg-gray-50 rounded-2xl border border-gray-200 text-sm text-gray-500 font-bold">
                    No studies match the selected filter.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasSearched && results.length === 0 && !error && (
        <div className="text-center py-12 md:py-20 px-4 bg-white rounded-2xl border border-gray-200 shadow-xl">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Microscope size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-black text-gray-700 mb-2">No Evidence Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto font-medium">No published studies were found for this combination. Try generic names or Latin alternatives.</p>
        </div>
      )}

      {!hasSearched && !loading && !error && (
        <div className="space-y-8 md:space-y-10 mt-4">
          <div className="text-center py-12 md:py-20 px-4 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-slate-800 text-white px-4 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-extrabold mb-6 md:mb-8 tracking-widest shadow-sm">MULTI-SOURCE SCIENTIFIC EVIDENCE</div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 md:mb-6 tracking-tight leading-tight">Precision Literature<br />Mining Engine</h2>
              <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8 md:mb-10 text-sm md:text-lg font-medium">Evaluate any drug-herb combination against global scientific databases. Instantly retrieve DOI links, citation metrics, and FDA-associated safety data.</p>
              <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
                <span className="px-4 md:px-5 py-2 md:py-2.5 bg-slate-800 text-white rounded-lg text-[10px] md:text-xs font-extrabold tracking-widest shadow-sm">EVIDENCE-BASED ONLY</span>
                <span className="px-4 md:px-5 py-2 md:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[10px] md:text-xs font-extrabold tracking-widest">MULTI-SOURCE SCIENTIFIC EVIDENCE</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4 px-1">Clinical Query Examples</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {EXAMPLE_SEARCHES.map(({ drug: d, herb: h }) => (
                <button key={d + h} type="button" onClick={() => { setDrug(d); setHerb(h); handleSearch(d, h); }} className="group bg-white/80 p-4 md:p-5 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 text-left">
                  <div className="flex items-center gap-2 mb-1.5 text-sm md:text-base font-bold text-gray-800"><Beaker size={15} className="text-red-400" />{d}</div>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-medium"><Leaf size={15} className="text-emerald-400" />{h}</div>
                  <div className="mt-3 text-xs font-semibold text-slate-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Analyze Interaction <ExternalLink size={11} /></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
