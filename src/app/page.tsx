'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, FlaskConical, FileText, ExternalLink, ArrowRight, Beaker, Leaf } from 'lucide-react';
import Link from 'next/link';
import AuthModal from '@/components/pharma/AuthModal';
import ConsentPopup from '@/components/pharma/ConsentPopup';
import ScientificDisclaimer from '@/components/pharma/ScientificDisclaimer';
import { API_SOURCES, EXAMPLE_SEARCHES } from '@/lib/knowledge-base';

export default function Home() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      const stored = localStorage.getItem('pharmainsight-consent');
      if (stored === 'true') {
        queueMicrotask(() => setConsentGiven(true));
      }
    }
  }, []);

  const handleAcceptConsent = () => {
    localStorage.setItem('pharmainsight-consent', 'true');
    setConsentGiven(true);
  };

  // Evidence preview for quick start cards
  const evidencePreviews: Record<string, string> = {
    'WarfarinSt. John\'s Wort': 'Major CYP3A4 interaction · High risk bleeding',
    'CyclosporineGinkgo biloba': 'P-glycoprotein modulation · Immunosuppressant levels',
    'MetforminGinseng': 'Additive hypoglycemic effect · Monitor glucose',
    'AtorvastatinGarlic': 'CYP3A4 metabolism overlap · Moderate risk',
    'TacrolimusCurcumin': 'CYP3A4/PGP inhibition · Transplant concern',
  };

  return (
    <>
      <AnimatePresence>
        {!consentGiven && <ConsentPopup onAccept={handleAcceptConsent} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased flex flex-col">
        <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8 w-full">
          <div className="space-y-8">
            {/* Hero - Reduced whitespace */}
            <div className="text-center py-8 md:py-10 px-4 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#0f172a] text-white px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-extrabold mb-4 md:mb-5 tracking-[0.2em] shadow-md">
                  EVIDENCE-BASED SCIENTIFIC PLATFORM
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-[#0f172a] mb-1 tracking-tight leading-tight">
                  PharmaInsight
                </h2>
                <p className="text-[11px] md:text-xs text-slate-600 font-semibold mb-3">Dr. Mahmoud Evidence-Based Drug–Herb Intelligence</p>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed mb-4 md:mb-6 text-[13px] md:text-base font-medium">
                  Evaluate drug-herb interactions and explore pharmacological profiles against global scientific databases. Powered by PubMed, CrossRef, OpenAlex, and OpenFDA.
                </p>

                <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
                  <Link
                    href="/interaction"
                    className="flex items-center gap-2 px-4 md:px-6 py-3 bg-[#0f172a] text-white rounded-xl text-xs md:text-sm font-bold shadow-lg hover:bg-[#1e293b] transition-all hover:shadow-xl group"
                  >
                    <AlertTriangle size={16} /> Drug-Natural Product Interaction
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/pharmacology"
                    className="flex items-center gap-2 px-4 md:px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs md:text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all hover:shadow-xl group"
                  >
                    <FlaskConical size={16} /> Pharmacology & Phytochemistry
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* API Sources */}
            <div>
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">Integrated Data Sources</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {API_SOURCES.map((s) => (
                  <div key={s.name} className="bg-white p-5 rounded-xl border border-gray-300 shadow-sm hover:shadow-md hover:border-gray-400 transition-all">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.color}`}></div>
                      <span className="text-sm font-bold text-gray-900">{s.name}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Start - With evidence previews */}
            <div>
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 px-1">Quick Start Examples</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {EXAMPLE_SEARCHES.map(({ drug, herb }) => (
                  <Link
                    key={drug + herb}
                    href="/interaction"
                    className="group bg-white/80 p-4 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-1.5 text-[13px] font-bold text-gray-800">
                      <Beaker size={14} className="text-red-400" />{drug}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <Leaf size={14} className="text-emerald-400" />{herb}
                    </div>
                    {/* Evidence preview */}
                    <div className="mt-2.5 text-[11px] font-bold text-violet-500 uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                      {evidencePreviews[drug + herb] || 'Evidence-based analysis'}
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-slate-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Go to Interaction Engine <ExternalLink size={10} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Features - With scientific color coding */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 bg-[#0f172a] rounded-lg flex items-center justify-center mb-3">
                  <AlertTriangle size={18} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1.5 text-[13px]">Interaction Engine</h4>
                <p className="text-[13px] text-gray-500 leading-relaxed">Search for drug-herb interactions with weighted evidence scoring, FDA safety signals, and DOI resolution.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center mb-3">
                  <FlaskConical size={18} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1.5 text-[13px]">Pharmacology & Phytochemistry Engine</h4>
                <p className="text-[13px] text-gray-500 leading-relaxed">Explore pharmacological actions, active compounds, and molecular mechanisms from PubMed literature.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center mb-3">
                  <FileText size={18} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1.5 text-[13px]">PDF Reports</h4>
                <p className="text-[13px] text-gray-500 leading-relaxed">Export professional scientific reports with clickable PMID/DOI links and evidence scoring breakdowns.</p>
              </div>
            </div>
          </div>
        </main>

        <ScientificDisclaimer />

        <footer className="border-t border-gray-200 mt-auto py-4 text-center bg-white">
          <p className="text-[11px] text-gray-500 font-bold tracking-wide">
            © 2026 PharmaInsight · Data: NCBI, CrossRef, OpenAlex, OpenFDA · Research Use Only
          </p>
        </footer>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
