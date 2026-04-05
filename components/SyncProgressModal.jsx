'use client';

import { X, CalendarCheck2, XCircle, Loader } from 'lucide-react';

export default function SyncProgressModal({ syncing, progress, onClose }) {
  if (!progress) return null;

  const { current, total, results } = progress;
  const syncedCount = results.filter(r => r.status === 'synced').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] px-4"
         style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-[400px] max-h-[70vh] overflow-auto rounded-2xl"
           style={{ background: '#12101f', border: '1px solid #1e1b30' }}>
        {/* Header */}
        <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
          <h3 className="m-0 text-base font-bold" style={{ color: '#f59e0b' }}>
            {syncing ? `Syncing ${current} of ${total}...` : 'Sync Complete'}
          </h3>
          {!syncing && (
            <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mx-5 mt-4 mb-3 rounded-lg overflow-hidden h-1.5" style={{ background: '#1a1625' }}>
          <div className="h-full rounded-lg transition-all duration-300"
               style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${(current / total) * 100}%` }} />
        </div>

        {/* Results */}
        <div className="px-5 pb-4">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 text-[13px]" style={{ borderBottom: '1px solid #1a1625' }}>
              {r.status === 'synced' ? (
                <CalendarCheck2 size={14} color="#10b981" />
              ) : (
                <XCircle size={14} color="#ef4444" />
              )}
              <span style={{ color: r.status === 'synced' ? '#e2e8f0' : '#ef4444' }}>
                {r.show.artist}
              </span>
              {r.error && (
                <span className="text-[10px] ml-auto" style={{ color: '#64748b' }}>{r.error}</span>
              )}
            </div>
          ))}

          {/* Summary */}
          {!syncing && (
            <div className="mt-3 text-[13px]" style={{ color: '#64748b' }}>
              {syncedCount} synced{failedCount > 0 ? `, ${failedCount} failed` : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
