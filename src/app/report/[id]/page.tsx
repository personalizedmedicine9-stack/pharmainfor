'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Clock, AlertTriangle, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import ScientificDisclaimer from '@/components/pharma/ScientificDisclaimer';

interface ReportItem {
  id: string;
  drugName?: string;
  herbName?: string;
  compoundName?: string;
  interactionType?: string;
  severity?: string;
  evidenceLevel?: string;
  confidenceScore?: number;
  mechanism?: string;
  mechanisms?: string;
  activeCompounds?: string;
  pharmacologicalActions?: string;
  references?: string;
  createdAt: string;
}

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        // Try interaction reports first
        let res = await fetch('/api/reports/interaction');
        if (res.ok) {
          const data = await res.json();
          const found = data.find((r: ReportItem) => r.id === id);
          if (found) {
            setReport(found);
            setLoading(false);
            return;
          }
        }

        // Try pharmacology reports
        res = await fetch('/api/reports/pharmacology');
        if (res.ok) {
          const data = await res.json();
          const found = data.find((r: ReportItem) => r.id === id);
          if (found) {
            setReport(found);
            setLoading(false);
            return;
          }
        }

        setError('Report not found.');
      } catch {
        setError('Failed to load report.');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 font-medium">Loading report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle size={32} className="text-rose-400 mx-auto" />
          <p className="text-gray-600 font-bold">{error || 'Report not found'}</p>
          <Link href="/" className="text-sm text-[#0f172a] font-bold underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isInteraction = !!report.drugName;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 antialiased flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#0f172a] mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isInteraction ? 'bg-[#0f172a]' : 'bg-emerald-600'}`}>
                {isInteraction ? <AlertTriangle size={18} className="text-white" /> : <FlaskConical size={18} className="text-white" />}
              </div>
              <div>
                <h1 className="text-xl font-black text-[#0f172a]">
                  {isInteraction ? `${report.drugName} + ${report.herbName}` : report.herbName || report.compoundName}
                </h1>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {isInteraction ? 'Interaction Report' : 'Pharmacology Report'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {isInteraction && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Interaction Type</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{report.interactionType || 'Not specified'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Severity</span>
                    <p className="text-sm font-bold text-gray-900 mt-1">{report.severity || 'Not determined'}</p>
                  </div>
                </>
              )}
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evidence Level</span>
                <p className="text-sm font-bold text-gray-900 mt-1">{report.evidenceLevel || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confidence Score</span>
                <p className="text-sm font-bold text-gray-900 mt-1">{report.confidenceScore ?? 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Created</span>
                <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1">
                  <Clock size={12} className="text-gray-400" />
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {report.mechanism && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Mechanism</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl leading-relaxed">{report.mechanism}</p>
              </div>
            )}

            {report.references && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">References</h3>
                <div className="bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(report.references), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileText size={12} />
                <span>Report ID: {report.id}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

        <ScientificDisclaimer />

        <footer className="border-t border-gray-100 mt-auto py-5 text-center bg-white">
          <p className="text-[10px] text-gray-400 font-bold tracking-wide">
            © {new Date().getFullYear()} PharmaInsight · Developed by <span className="text-gray-600 font-extrabold">Dr. Mahmoud Mostafa</span> · Data: NCBI, CrossRef, OpenAlex, OpenFDA · Research Use Only
          </p>
        </footer>
    </div>
  );
}
