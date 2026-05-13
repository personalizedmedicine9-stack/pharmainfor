'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, BookOpen, ChevronDown, ChevronUp, Users, Calendar, Quote, Copy, Check, TrendingUp, AlertTriangle, Link2 } from 'lucide-react';
import type { StudyResult } from '@/lib/types';

interface StudyCardProps {
  study: StudyResult;
  index: number;
}

const EVIDENCE_STYLES: Record<string, string> = {
  High: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  Moderate: 'bg-amber-100 text-amber-800 border border-amber-200',
  Low: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const JOURNAL_STYLES: Record<string, string> = {
  'High-impact journal': 'bg-blue-100 text-blue-800 border border-blue-200',
  'Medium-impact journal': 'bg-sky-100 text-sky-800 border border-sky-200',
  'Low/uncertain quality': 'bg-slate-100 text-slate-500 border border-slate-200',
};

const RELEVANCE_STYLES: Record<string, string> = {
  HIGH: 'bg-emerald-600 text-white',
  MEDIUM: 'bg-amber-500 text-white',
  LOW: 'bg-slate-400 text-white',
};

const STUDY_TYPE_ABBR: Record<string, string> = {
  'Meta-analysis': 'MA',
  'Systematic Review': 'SR',
  'Randomized Controlled Trial': 'RCT',
  'Cohort Study': 'CS',
  'Case-Control': 'CC',
  'Case Report': 'CR',
  'Narrative Review': 'NR',
  'Animal Study': 'AS',
  'In Vitro': 'IV',
  'Mechanistic Study': 'MS',
};

function buildCitation(study: StudyResult): string {
  const authors = study.authors.length > 0
    ? study.authors.join(', ') + (study.authors.length >= 3 ? ' et al.' : '')
    : 'Unknown Authors';
  const doi = study.doi ? ` DOI: ${study.doi}.` : '';
  return `${authors} "${study.title}." ${study.journal}${study.pubYear ? ` (${study.pubYear})` : ''}. PMID: ${study.pmid}.${doi}`;
}

export default function StudyCard({ study, index }: StudyCardProps) {
  const [abstractOpen, setAbstractOpen] = useState(false);
  const [fdaOpen, setFdaOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCitation(study));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasFdaWarnings = study.fdaWarnings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="bg-white rounded-2xl border border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group"
    >
      <div className="p-5 md:p-7">
        <div className="flex items-start gap-3 mb-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-800 font-bold text-base md:text-lg leading-snug">
              {study.title}
            </h3>
            {study.mechanismDescription && study.mechanismDescription !== 'Mechanistic pathway not fully characterized from available evidence' && (
              <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-sky-50 border border-sky-200 rounded text-xs text-sky-700 font-semibold uppercase tracking-wide">
                {study.mechanismDescription}
              </span>
            )}
          </div>
          <a
            href={study.pubmedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
            title="Open on PubMed"
          >
            <ExternalLink size={15} />
          </a>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
            PubMed #{study.pmid}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RELEVANCE_STYLES[study.relevanceLabel]}`}>
            {study.relevanceLabel} Relevance
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white">
            {STUDY_TYPE_ABBR[study.studyType] ?? '??'}&nbsp;{study.studyType}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${EVIDENCE_STYLES[study.evidenceLevel]}`}>
            {study.evidenceLevel} Evidence
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${JOURNAL_STYLES[study.journalQuality]}`}>
            {study.journalQuality}
          </span>
          {study.citationCount > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
              <TrendingUp size={11} />
              {study.citationCount.toLocaleString()} citations
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Score {study.compositeScore}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[13px] text-slate-500 mb-3">
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} />
            <span className="font-medium">{study.journal || 'Unknown Journal'}</span>
          </span>
          {study.pubYear && (
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />
              {study.pubYear}
            </span>
          )}
          {study.authors.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Users size={13} />
              {study.authors.slice(0, 3).join(', ')}{study.authors.length > 3 ? ' et al.' : ''}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          {study.doiLink && (
            <a
              href={study.doiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Link2 size={13} />
              <span className="font-mono">{study.doi}</span>
            </a>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-[13px] text-slate-600 hover:text-blue-700 transition-all"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy citation'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {study.abstract && (
            <button
              onClick={() => setAbstractOpen(!abstractOpen)}
              className="flex items-center gap-1 text-[13px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {abstractOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {abstractOpen ? 'Hide abstract' : 'Show abstract'}
            </button>
          )}
          {hasFdaWarnings && (
            <button
              onClick={() => setFdaOpen(!fdaOpen)}
              className="flex items-center gap-1 text-[13px] text-amber-600 hover:text-amber-800 font-medium transition-colors"
            >
              <AlertTriangle size={13} />
              {fdaOpen ? 'Hide FDA data' : 'Show FDA warnings'}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 md:px-7 pb-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 font-medium pt-2">Source: PubMed / CrossRef / OpenAlex</p>
      </div>

      <AnimatePresence>
        {abstractOpen && study.abstract && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-7 pb-5 md:pb-6 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-1.5 pt-4 mb-2">
                <Quote size={13} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Abstract</span>
              </div>
              <p className="text-slate-700 text-[15px] leading-relaxed study-card-text">{study.abstract}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fdaOpen && hasFdaWarnings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-7 pb-5 md:pb-6 border-t border-amber-100 bg-amber-50/40">
              <div className="flex items-center gap-1.5 pt-4 mb-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">FDA Label Data</span>
              </div>
              <div className="space-y-2">
                {study.fdaWarnings.map((w, i) => (
                  <p key={i} className="text-amber-800 text-sm leading-relaxed border-l-2 border-amber-300 pl-3 fda-warning-text">{w}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
