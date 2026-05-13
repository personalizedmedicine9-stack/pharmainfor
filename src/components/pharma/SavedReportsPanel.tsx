'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Trash2, FlaskConical, Leaf, Shield, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import type { SavedReport } from '@/lib/types';

interface SavedReportRow extends SavedReport {
  evidence_level?: string;
  confidence?: string;
}

const REPORT_TYPE_STYLES = {
  interaction: {
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    icon: FlaskConical,
    label: 'Interaction',
  },
  pharmacology: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Leaf,
    label: 'Pharmacology & Phytochemistry',
  },
} as const;

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
  Strong: 'bg-blue-100 text-blue-800 border border-blue-200',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function SavedReportsPanel() {
  const { isAuthenticated, user } = useAuth();
  const [reports, setReports] = useState<SavedReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === userIdRef.current) return;
    userIdRef.current = uid;

    if (!uid) {
      return;
    }

    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
    });
    const mode = user?.authMode || 'local';
    fetch(`/api/saved-reports?userId=${uid}&authMode=${mode}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          setReports(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReports([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    setDeleting(id);
    try {
      const mode = user?.authMode || 'local';
      const res = await fetch(`/api/saved-reports?id=${id}&userId=${user.id}&authMode=${mode}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Report deleted successfully.');
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error('Failed to delete report. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
    setDeleting(null);
    setConfirmDelete(null);
  };

  const getEvidenceLevel = (report: SavedReportRow): string => {
    if (report.evidence_level) return report.evidence_level;
    const data = report.report_data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.evidence_level === 'string') return data.evidence_level;
      if (data.evidenceScores && typeof data.evidenceScores === 'object') {
        const scores = data.evidenceScores as Record<string, unknown>;
        if (typeof scores.evidenceLevel === 'string') return scores.evidenceLevel;
      }
    }
    return 'Low';
  };

  const getConfidence = (report: SavedReportRow): string => {
    if (report.confidence) return report.confidence;
    const data = report.report_data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.confidence === 'string') return data.confidence;
      if (data.evidenceScores && typeof data.evidenceScores === 'object') {
        const scores = data.evidenceScores as Record<string, unknown>;
        if (typeof scores.confidence === 'string') return scores.confidence;
      }
    }
    return 'Low';
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Shield size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          Sign in to save and access your reports.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-48" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Bookmark size={24} className="text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm text-center max-w-sm">
          No saved reports yet. Save a report to access it later.
        </p>
      </div>
    );
  }

  // Reports list
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {reports.map((report, index) => {
          const typeConfig = REPORT_TYPE_STYLES[report.report_type] || REPORT_TYPE_STYLES.interaction;
          const TypeIcon = typeConfig.icon;
          const evidenceLevel = getEvidenceLevel(report);
          const confidence = getConfidence(report);
          const isDeleting = deleting === report.id;
          const isConfirming = confirmDelete === report.id;

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
              layout
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeConfig.badge}`}>
                      <TypeIcon size={11} />
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold text-[#0f172a] truncate">
                    {report.report_type === 'interaction'
                      ? `${report.drug_name || 'Unknown Drug'} × ${report.herb_name || 'Unknown Herb'}`
                      : report.herb_name || 'Unknown Herb'}
                  </h3>

                  {/* Evidence & Confidence badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${EVIDENCE_STYLES[evidenceLevel] || EVIDENCE_STYLES.Low}`}>
                      {evidenceLevel} Evidence
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CONFIDENCE_STYLES[confidence] || CONFIDENCE_STYLES.Low}`}>
                      {confidence} Confidence
                    </span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-slate-400 mt-2.5">
                    {formatDate(report.created_at)}
                  </p>
                </div>

                {/* Delete */}
                <div className="flex-shrink-0">
                  {isConfirming ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Confirm delete"
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <AlertCircle size={12} />
                        )}
                        {isDeleting ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg transition-colors"
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(report.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label="Delete report"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
