'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Eye, Trash2, AlertCircle } from 'lucide-react';

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

interface ReportViewerProps {
  type: 'interaction' | 'pharmacology';
}

export default function ReportViewer({ type }: ReportViewerProps) {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (reportType: 'interaction' | 'pharmacology') => {
    const endpoint = reportType === 'interaction' ? '/api/reports/interaction' : '/api/reports/pharmacology';
    const res = await fetch(endpoint);
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to load reports.');
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setLoading(true); });
    queueMicrotask(() => { if (!cancelled) setError(null); });

    fetchReports(type)
      .then((data) => {
        if (!cancelled) queueMicrotask(() => setReports(data));
      })
      .catch(() => {
        if (!cancelled) queueMicrotask(() => setError('Network error.'));
      })
      .finally(() => {
        if (!cancelled) queueMicrotask(() => setLoading(false));
      });

    return () => { cancelled = true; };
  }, [type, fetchReports]);

  const deleteReport = async (id: string) => {
    try {
      const endpoint = type === 'interaction' ? '/api/reports/interaction' : '/api/reports/pharmacology';
      await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      setReports(reports.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <AlertCircle size={24} className="text-rose-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <FileText size={32} className="text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">No Reports Yet</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          {type === 'interaction'
            ? 'Run an interaction search and save results to see reports here.'
            : 'Run a pharmacology search and save results to see reports here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Report List */}
      <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 py-2">
          {type === 'interaction' ? 'Interaction' : 'Pharmacology'} Reports ({reports.length})
        </h3>
        {reports.map((report) => (
          <motion.button
            key={report.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSelectedReport(report)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedReport?.id === report.id
                ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                : 'bg-white border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-bold ${selectedReport?.id === report.id ? 'text-white' : 'text-gray-900'}`}>
                  {type === 'interaction'
                    ? `${report.drugName} + ${report.herbName}`
                    : report.herbName || report.compoundName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {report.evidenceLevel && (
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      report.evidenceLevel === 'High' ? 'bg-emerald-100 text-emerald-800' :
                      report.evidenceLevel === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {report.evidenceLevel}
                    </span>
                  )}
                  <span className={`text-xs ${selectedReport?.id === report.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    <Clock size={10} className="inline mr-1" />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete report"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Report Detail */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {selectedReport ? (
            <motion.div
              key={selectedReport.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Eye size={18} className="text-gray-500" />
                <h3 className="text-lg font-bold text-gray-900">
                  {type === 'interaction'
                    ? `${selectedReport.drugName} + ${selectedReport.herbName}`
                    : selectedReport.herbName || selectedReport.compoundName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {type === 'interaction' && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Interaction Type</span>
                      <p className="text-sm font-bold text-gray-900">{selectedReport.interactionType || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500">Severity</span>
                      <p className="text-sm font-bold text-gray-900">{selectedReport.severity || 'Not determined'}</p>
                    </div>
                  </>
                )}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Evidence Level</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.evidenceLevel || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-xs text-gray-500">Confidence Score</span>
                  <p className="text-sm font-bold text-gray-900">{selectedReport.confidenceScore ?? 'N/A'}</p>
                </div>
              </div>

              {selectedReport.mechanism && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-2">Mechanism</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedReport.mechanism}</p>
                </div>
              )}

              {selectedReport.references && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-2">References</h4>
                  <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(selectedReport.references), null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Created: {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-gray-200"
            >
              <FileText size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Select a report to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
