'use client';

import { useMemo } from 'react';
import { Edit3, CalendarPlus, CalendarCheck2, Loader, Ticket } from 'lucide-react';
import {
  ATTEND_STATES, ATTEND_LABELS, ATTEND_INLINE_COLORS,
  TICKET_STATES, TICKET_LABELS, TICKET_INLINE_COLORS,
  SOURCE_LABELS, formatDate, showTimeStr,
} from '@/lib/utils';

export default function ListView({ shows, onShowClick, onCycleAttending, onCycleTicket, syncingShowIds }) {
  const sorted = useMemo(() => [...shows].sort((a, b) => a.date.localeCompare(b.date)), [shows]);

  if (sorted.length === 0) {
    return <div className="text-center py-10" style={{ color: '#475569' }}>No shows match filters</div>;
  }

  return (
    <div className="p-3 flex flex-col gap-1.5">
      {sorted.map(s => {
        const isPast = new Date(s.date) < new Date(new Date().toDateString());
        const sourceInfo = SOURCE_LABELS[s.source] || SOURCE_LABELS.manual;
        return (
          <div key={s.id}
               className="rounded-[10px] px-3 py-2.5"
               style={{
                 background: '#12101f',
                 border: '1px solid #1e1b30',
                 opacity: isPast ? 0.5 : 1,
               }}>
            <div className="flex justify-between items-start mb-1.5">
              <div onClick={() => onShowClick(s)} className="cursor-pointer flex-1">
                <div className="text-sm font-semibold flex items-center gap-1.5 flex-wrap" style={{ color: '#e2e8f0' }}>
                  {s.artist}
                  {syncingShowIds.has(s.id) ? (
                    <Loader size={12} color="#f59e0b" className="animate-spin" />
                  ) : s.calendarSynced ? (
                    <CalendarCheck2 size={12} color="#f59e0b" />
                  ) : null}
                  {s.unverified && (
                    <span className="text-[9px] font-bold px-[5px] py-[1px] rounded" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
                      ?
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: '#64748b' }}>
                  {s.venue} · {formatDate(s.date)}{s.endDate ? ` – ${formatDate(s.endDate)}` : ''} · {showTimeStr(s)}
                  <span className="text-[9px] font-medium px-[5px] py-[1px] rounded" style={{ color: sourceInfo.color, background: `${sourceInfo.color}15` }}>
                    {sourceInfo.label}
                  </span>
                </div>
                {s.notes && (
                  <div className="text-[11px] mt-[3px] whitespace-pre-wrap leading-snug" style={{ color: '#475569' }}>{s.notes}</div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {!s.calendarSynced && (
                  <button className="flex items-center rounded-md p-[4px_6px] cursor-pointer border-none"
                          style={{ background: '#422006', color: '#f59e0b' }}>
                    <CalendarPlus size={14} />
                  </button>
                )}
                <button onClick={() => onShowClick(s)}
                        className="bg-transparent border-none cursor-pointer p-1"
                        style={{ color: '#475569' }}>
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            {/* Segmented attending pills */}
            <div className="flex gap-0 rounded-lg overflow-hidden mb-1.5" style={{ border: '1px solid #2d2640' }}>
              {ATTEND_STATES.map(a => {
                const active = s.attending === a;
                const colors = ATTEND_INLINE_COLORS[a];
                return (
                  <button key={a}
                          onClick={() => onCycleAttending(s.id, a)}
                          className="flex-1 py-[5px] text-[11px] font-medium cursor-pointer border-none"
                          style={{
                            background: active ? colors.bg : 'transparent',
                            color: active ? colors.color : '#475569',
                          }}>
                    {ATTEND_LABELS[a]}
                  </button>
                );
              })}
            </div>

            {/* Segmented ticket pills */}
            <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #2d2640' }}>
              {TICKET_STATES.map(t => {
                const active = s.ticketStatus === t;
                const colors = TICKET_INLINE_COLORS[t];
                return (
                  <button key={t}
                          onClick={() => onCycleTicket(s.id, t)}
                          className="flex-1 py-[5px] text-[11px] font-medium cursor-pointer border-none"
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
        );
      })}
    </div>
  );
}
