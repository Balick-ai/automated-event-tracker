'use client';

import { X, Save, CalendarPlus, CalendarCheck2, Trash2 } from 'lucide-react';
import {
  ATTEND_STATES, ATTEND_LABELS, ATTEND_INLINE_COLORS,
  TICKET_STATES, TICKET_LABELS, TICKET_INLINE_COLORS,
  SOURCE_LABELS,
} from '@/lib/utils';

export default function EditModal({ show, setModal, onSave, onDelete, isExisting }) {
  const modal = show;
  const sourceInfo = SOURCE_LABELS[modal.source] || SOURCE_LABELS.manual;

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={() => setModal(null)}>
      <div onClick={e => e.stopPropagation()}
           className="w-full max-w-[500px] max-h-[85vh] overflow-auto"
           style={{ background: '#12101f', borderRadius: '16px 16px 0 0', border: '1px solid #1e1b30', borderBottom: 'none' }}>
        {/* Header */}
        <div className="px-4 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
          <div className="flex items-center gap-2">
            <h3 className="m-0 text-base font-bold" style={{ color: '#a78bfa' }}>
              {modal.id ? 'Edit Show' : 'Add Show'}
            </h3>
            {modal.id && (
              <span className="text-[10px] font-medium px-[6px] py-[2px] rounded"
                    style={{ color: sourceInfo.color, background: `${sourceInfo.color}15` }}>
                {sourceInfo.label}
              </span>
            )}
          </div>
          <button onClick={() => setModal(null)} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {/* Unverified warning */}
          {modal.id && modal.unverified && (
            <div className="p-3.5 rounded-[10px] flex flex-col gap-2"
                 style={{ background: '#1a1200', border: '1px solid #92400e' }}>
              <div className="text-[13px] leading-snug" style={{ color: '#f59e0b' }}>
                This show wasn&apos;t found in the last discovery search. Is it still happening?
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ ...modal, unverified: false, lastVerified: Date.now() })}
                        className="flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-none"
                        style={{ background: '#064e3b', color: '#10b981' }}>
                  Yes, Still Happening
                </button>
                <button onClick={() => { setModal(null); onDelete(modal.id); }}
                        className="flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-none"
                        style={{ background: '#450a0a', color: '#ef4444' }}>
                  Remove Show
                </button>
              </div>
            </div>
          )}

          {/* Artist */}
          <Field label="Artist" value={modal.artist} onChange={v => setModal({ ...modal, artist: v })} />

          {/* Venue */}
          <Field label="Venue" value={modal.venue} onChange={v => setModal({ ...modal, venue: v })} />

          {/* Dates */}
          <div className="flex gap-2.5">
            <Field label="Date" value={modal.date} onChange={v => setModal({ ...modal, date: v })} type="date" />
            <Field label="End Date (multi-day)" value={modal.endDate || ''} onChange={v => setModal({ ...modal, endDate: v || null })} type="date" />
          </div>

          {/* Times */}
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Start Time (opt.)</label>
              <div className="flex gap-1 items-center">
                <input type="time" value={modal.startTime || ''}
                       onChange={e => setModal({ ...modal, startTime: e.target.value || null })}
                       className="flex-1 px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
                {modal.startTime && (
                  <button onClick={() => setModal({ ...modal, startTime: null })}
                          className="bg-transparent border-none cursor-pointer p-0.5" style={{ color: '#64748b' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>End Time (opt.)</label>
              <div className="flex gap-1 items-center">
                <input type="time" value={modal.endTime || ''}
                       onChange={e => setModal({ ...modal, endTime: e.target.value || null })}
                       className="flex-1 px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
                {modal.endTime && (
                  <button onClick={() => setModal({ ...modal, endTime: null })}
                          className="bg-transparent border-none cursor-pointer p-0.5" style={{ color: '#64748b' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="text-[11px] -mt-2" style={{ color: '#475569' }}>
            Leave blank for all-day. End time defaults to start + 4hrs.
          </div>

          {/* Attending — segmented pills */}
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Attending</label>
            <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #2d2640' }}>
              {ATTEND_STATES.map(a => {
                const active = modal.attending === a;
                const colors = ATTEND_INLINE_COLORS[a];
                return (
                  <button key={a}
                          onClick={() => setModal({ ...modal, attending: a })}
                          className="flex-1 py-[7px] text-[12px] font-medium cursor-pointer border-none"
                          style={{
                            background: active ? colors.bg : 'transparent',
                            color: active ? colors.color : '#475569',
                          }}>
                    {ATTEND_LABELS[a]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ticket — segmented pills */}
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Ticket</label>
            <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #2d2640' }}>
              {TICKET_STATES.map(t => {
                const active = modal.ticketStatus === t;
                const colors = TICKET_INLINE_COLORS[t];
                return (
                  <button key={t}
                          onClick={() => setModal({ ...modal, ticketStatus: t })}
                          className="flex-1 py-[7px] text-[12px] font-medium cursor-pointer border-none"
                          style={{
                            background: active ? colors.bg : 'transparent',
                            color: active ? colors.color : '#475569',
                          }}>
                    {TICKET_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Notes</label>
            <textarea value={modal.notes}
                      onChange={e => setModal({ ...modal, notes: e.target.value })}
                      placeholder="Artists, lineup, details..."
                      rows={3}
                      className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none resize-y min-h-[72px] leading-relaxed"
                      style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-1 flex-wrap">
            <button onClick={() => onSave(modal)}
                    className="flex-1 min-w-[100px] py-2.5 rounded-[10px] text-[13px] font-semibold cursor-pointer border-none text-white flex items-center justify-center gap-1.5"
                    style={{ background: modal.calendarSynced ? 'linear-gradient(135deg, #7c3aed, #f59e0b)' : 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Save size={16} />
              {modal.calendarSynced ? 'Save & Update Cal' : 'Save'}
            </button>
            {isExisting && !modal.calendarSynced && (
              <button className="py-2.5 px-3 rounded-[10px] text-[13px] font-semibold cursor-pointer flex items-center gap-1"
                      style={{ background: '#422006', border: '1px solid #f59e0b', color: '#f59e0b' }}>
                <CalendarPlus size={14} /> Sync
              </button>
            )}
            {isExisting && modal.calendarSynced && (
              <div className="py-2.5 px-3 flex items-center gap-1 text-[13px]" style={{ color: '#f59e0b' }}>
                <CalendarCheck2 size={14} /> Synced
              </div>
            )}
            {isExisting && (
              <button onClick={() => onDelete(modal.id)}
                      className="py-2.5 px-3 rounded-[10px] text-[13px] font-semibold cursor-pointer flex items-center gap-1"
                      style={{ background: '#1a1625', border: '1px solid #dc2626', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className="flex-1">
      <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>{label}</label>
      <input type={type} value={value}
             onChange={e => onChange(e.target.value)}
             className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
             style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
    </div>
  );
}
