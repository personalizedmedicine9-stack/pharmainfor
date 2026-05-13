'use client';

import { ShieldAlert } from 'lucide-react';

export default function ScientificDisclaimer() {
  return (
    <div className="w-full bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-5">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <ShieldAlert size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 leading-relaxed space-y-1">
            <p className="font-bold">Scientific Disclaimer</p>
            <p>For research and educational use only. Not intended for clinical decision-making or medical advice. Always consult a qualified healthcare professional.</p>
            <p className="text-amber-600 font-medium text-xs">Developed by Dr. Mahmoud Mostafa · PharmaInsight</p>
          </div>
        </div>
      </div>
    </div>
  );
}
