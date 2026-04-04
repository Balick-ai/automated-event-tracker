'use client';

import { X, Plus, Edit3, XCircle, CheckCheck, Globe } from 'lucide-react';
import { formatDate, formatTime12 } from '@/lib/utils';

export default function DiscoveryQueue({
  queue,
  dismissed,
  warning,
  unverifiedShows,
  newCount,
  onAdd,
  onEditAndAdd,
  onDismiss,
  onAddAllNew,
  onClose,
  onConfirmStillHappening,
  onRemoveUnverified,
}) {
  return (
    <div className="p-3">
      <div className="rounded-xl overflow-hidden" style={{ background: '#0a1628', border: '1px solid #164e63' }}>
        {/* Header */}
        <div className="px-3.5 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid #164e63' }}>
          <div>
            <span className="text-[15px] font-bold" style={{ color: '#0ea5e9' }}>Discovered</span>
            <span className="text-xs ml-2" style={{ color: '#64748b' }}>
              {queue.length} found · {newCount} new
            </span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>

        {/* Add All button */}
        {newCount > 0 && (
          <div className="px-3.5 py-2" style={{ borderBottom: '1px solid #164e63', background: '#0c1a2e' }}>
            <button onClick={onAddAllNew}
                    className="w-full py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
              <CheckCheck size={16} /> Add All {newCount} New
            </button>
          </div>
        )}

        {/* Warning */}
        {warning && (
          <div className="px-3.5 py-2.5 flex items-start gap-2" style={{ borderBottom: '1px solid #164e63', background: '#1a1200' }}>
            <span className="text-base shrink-0" style={{ color: '#f59e0b' }}>&#9888;&#65039;</span>
            <div className="text-xs leading-snug" style={{ color: '#f59e0b' }}>{warning}</div>
          </div>
        )}

        {/* Results list */}
        <div className="max-h-[60vh] overflow-auto">
          {queue.length === 0 && (
            <div className="py-6 text-center text-[13px]" style={{ color: '#475569' }}>No shows found.</div>
          )}
          {queue.map(item => {
            if (dismissed.has(item._id)) return null;
            const dup = item._duplicate;
            return (
              <div key={item._id} className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #0f2030', opacity: dup ? 0.5 : 1 }}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: dup ? '#475569' : '#e2e8f0' }}>
                      {item.artist}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {item.venue} · {formatDate(item.date)}
                      {item.startTime ? ` · ${formatTime12(item.startTime)}` : ''}
                      {item.endDate ? ` – ${formatDate(item.endDate)}` : ''}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-snug" style={{ color: '#475569' }}>
                        {item.notes}
                      </div>
                    )}
                    {dup && (
                      <div className="text-[11px] mt-[3px] font-medium"
                           style={{ color: item._justAdded ? '#10b981' : '#0ea5e9' }}>
                        {item._justAdded ? 'Added!' : 'Already tracked'}
                      </div>
                    )}
                  </div>
                  {!dup && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => onAdd(item)}
                              className="flex items-center gap-[3px] rounded-md cursor-pointer border-none px-2 py-1.5 text-xs font-medium"
                              style={{ background: '#064e3b', color: '#10b981' }}>
                        <Plus size={14} /> Add
                      </button>
                      <button onClick={() => onEditAndAdd(item)}
                              className="flex items-center rounded-md cursor-pointer border-none px-2 py-1.5"
                              style={{ background: '#1e1b30', color: '#a78bfa' }}>
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => onDismiss(item._id)}
                              className="flex items-center rounded-md cursor-pointer border-none px-2 py-1.5"
                              style={{ background: '#1a0a0a', color: '#64748b' }}>
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unverified shows section */}
        {unverifiedShows.length > 0 && (
          <div style={{ borderTop: '2px solid #92400e' }}>
            <div className="px-3.5 py-3 flex items-center gap-2" style={{ background: '#1a1200' }}>
              <span className="text-base">&#9888;&#65039;</span>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: '#f59e0b' }}>
                  {unverifiedShows.length} tracked show{unverifiedShows.length > 1 ? 's' : ''} not found in this search
                </div>
                <div className="text-[11px]" style={{ color: '#a3854a' }}>
                  May be cancelled, rescheduled, or just not indexed. Please verify.
                </div>
              </div>
            </div>
            <div className="max-h-[300px] overflow-auto">
              {unverifiedShows.map(s => (
                <div key={s.id} className="px-3.5 py-2.5 flex justify-between items-start" style={{ borderTop: '1px solid #2a1e00' }}>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{s.artist}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{s.venue} · {formatDate(s.date)}</div>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => onConfirmStillHappening(s.id)}
                            className="rounded-md cursor-pointer border-none px-2 py-[5px] text-[11px] font-semibold"
                            style={{ background: '#064e3b', color: '#10b981' }}>
                      Still On
                    </button>
                    <button onClick={() => onRemoveUnverified(s.id)}
                            className="rounded-md cursor-pointer border-none px-2 py-[5px] text-[11px] font-semibold"
                            style={{ background: '#450a0a', color: '#ef4444' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
