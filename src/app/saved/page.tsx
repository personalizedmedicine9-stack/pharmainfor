'use client';

import SavedReportsPanel from '@/components/pharma/SavedReportsPanel';
import ScientificDisclaimer from '@/components/pharma/ScientificDisclaimer';

export default function SavedReportsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">Saved Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Your bookmarked interaction and pharmacology reports</p>
        </div>
        <SavedReportsPanel />
      </main>
      <ScientificDisclaimer />
      <footer className="border-t border-gray-100 mt-auto py-4 text-center bg-white">
        <p className="text-[10px] text-gray-400 font-bold tracking-wide">
          © {new Date().getFullYear()} PharmaInsight · Research Use Only
        </p>
      </footer>
    </div>
  );
}
