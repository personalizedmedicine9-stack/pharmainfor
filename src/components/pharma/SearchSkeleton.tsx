'use client';

export default function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse"
        >
          <div className="p-5 md:p-6">
            {/* Title row */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0" />
            </div>

            {/* Badge row */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <div className="h-5 w-20 rounded-full bg-slate-200" />
              <div className="h-5 w-24 rounded-full bg-slate-100" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
              <div className="h-5 w-28 rounded-full bg-slate-100" />
            </div>

            {/* Meta row */}
            <div className="flex gap-4 mb-3">
              <div className="h-3 bg-slate-100 rounded w-32" />
              <div className="h-3 bg-slate-100 rounded w-16" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>

            {/* DOI + copy row */}
            <div className="flex gap-3 mb-3">
              <div className="h-6 bg-slate-100 rounded w-40" />
              <div className="h-6 bg-slate-100 rounded w-24" />
            </div>

            {/* Action buttons placeholder */}
            <div className="flex gap-4">
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-28" />
            </div>
          </div>

          {/* Bottom timestamp */}
          <div className="px-5 md:px-6 pb-3 border-t border-slate-50">
            <div className="pt-2">
              <div className="h-2.5 bg-slate-100 rounded w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
