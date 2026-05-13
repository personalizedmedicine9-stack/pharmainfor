'use client';

import { useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PdfExportButtonProps {
  reportType: 'interaction' | 'pharmacology';
  onExport?: () => void;
  disabled?: boolean;
}

/**
 * PdfExportButton - A button component for triggering PDF exports.
 * Can be used standalone with an onExport callback, or as a visual wrapper
 * around PDFDownloadLink from @react-pdf/renderer.
 */
export default function PdfExportButton({ reportType, onExport, disabled }: PdfExportButtonProps) {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    if (onExport) onExport();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleExport}
      disabled={disabled}
      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-bold transition-all shadow-md ${
        exported
          ? 'bg-emerald-600 text-white'
          : reportType === 'interaction'
            ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white'
      }`}
    >
      {exported ? (
        <>
          <CheckCircle size={18} />
          PDF Downloaded!
        </>
      ) : (
        <>
          <Download size={18} />
          Export {reportType === 'interaction' ? 'Interaction' : 'Pharmacology'} PDF
        </>
      )}
    </motion.button>
  );
}
