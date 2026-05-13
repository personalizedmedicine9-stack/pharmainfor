'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import PharmacologyEngine from '@/components/pharma/PharmacologyEngine';
import AuthModal from '@/components/pharma/AuthModal';
import ConsentPopup from '@/components/pharma/ConsentPopup';
import ScientificDisclaimer from '@/components/pharma/ScientificDisclaimer';
import type { PharmacologyResponse } from '@/lib/types';

export default function PharmacologyPage() {
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

  const handlePharmacologySearch = async (herb: string): Promise<PharmacologyResponse | null> => {
    try {
      const res = await fetch('/api/pharmacology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herb }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  return (
    <>
      <AnimatePresence>
        {!consentGiven && <ConsentPopup onAccept={handleAcceptConsent} />}
      </AnimatePresence>

      <div className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased flex flex-col">
        <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8 w-full">
          <PharmacologyEngine onSearch={handlePharmacologySearch} onSignInRequired={() => setAuthModalOpen(true)} />
        </main>

        <ScientificDisclaimer />

        <footer className="border-t border-gray-100 mt-auto py-4 text-center bg-white">
          <p className="text-[10px] text-gray-400 font-bold tracking-wide">
            © {new Date().getFullYear()} PharmaInsight · Data: NCBI, CrossRef, OpenAlex, OpenFDA · Research Use Only
          </p>
        </footer>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
