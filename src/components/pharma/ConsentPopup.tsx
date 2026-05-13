'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ConsentPopupProps {
  onAccept: () => void;
}

export default function ConsentPopup({ onAccept }: ConsentPopupProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Clinical Disclaimer</h2>
              <p className="text-xs text-gray-400 font-medium">Please read before proceeding</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              'Not a substitute for professional medical advice.',
              'Do not use for diagnosing or treating health problems.',
              'Always consult a healthcare provider for drug interactions.',
              'For research and educational use only. Not intended for clinical decision-making or medical advice.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>

          <button
            onClick={onAccept}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            I Understand — Enter Platform
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
