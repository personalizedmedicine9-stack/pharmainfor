'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import InteractionEngine from '@/components/pharma/InteractionEngine';
import AuthModal from '@/components/pharma/AuthModal';
import ConsentPopup from '@/components/pharma/ConsentPopup';
import ScientificDisclaimer from '@/components/pharma/ScientificDisclaimer';
import type { SearchHistoryEntry } from '@/lib/types';

export default function InteractionPage() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
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

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/search-history');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((h: Record<string, unknown>) => ({
          id: h.id as string,
          query: h.query as string,
          engineType: h.engineType as string,
          resultsCount: h.resultsCount as number,
          sourcesUsed: JSON.parse((h.sourcesUsed as string) || '[]'),
          topCitationCount: h.topCitationCount as number,
          hasFdaData: h.hasFdaData as boolean,
          timestamp: h.timestamp as string,
        }));
        queueMicrotask(() => setHistory(mapped));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <>
      <AnimatePresence>
        {!consentGiven && <ConsentPopup onAccept={handleAcceptConsent} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased flex flex-col">
        <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8 w-full">
          <InteractionEngine history={history} onHistoryUpdate={loadHistory} onSignInRequired={() => setAuthModalOpen(true)} />
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
