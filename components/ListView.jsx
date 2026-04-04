'use client';

import { useMemo } from 'react';
import { Edit3, CalendarPlus, CalendarCheck2, Loader, Ticket, CircleCheck, CircleDot, CircleX, CircleMinus } from 'lucide-react';
import {
  ATTEND_STATES, ATTEND_LABELS, ATTEND_COLORS,
  TICKET_LABELS, TICKET_COLORS,
  formatDate, showTimeStr,
} from '@/lib/utils';

function AttendIcon({ status, size = 14 }) {
  const props = { size, strokeWidth: 2 };
  if (status === 'going') return <CircleCheck {...props} />;
  if (status === 'maybe') return <CircleDot {...props} />;
  if (status === 'not going') return <CircleX {...props} />;
  return <CircleMinus {...props} />;
}

export default function ListView({ shows, onShowClick, onCycleAttending, onCycleTicket, syncingShowIds }) {
  const sorted = useMemo(() => [...shows].sort((a, b) => a.date.localeCompare(b.date)), [shows]);

  if (sorted.length === 0) {
    return <div className="text-center py-10" style={{ color: '#475569' }}>No shows match filters</div>;
  }

  return (
    <div className="p-3 flex flex-col gap-1.5">
      {sorted.map(s => {
        const isPast = new Date(s.date) < new Date(new Date().toDateString());
        return (
          <div key={s.id}
               className="rounded-[10px] px-3 py-2.5"
               style={{
                 background: '#12101f',
                 border: s.source === 'search' ? '1px solid #164e63' : '1px solid #1e1b30',
                 opacity: isPast ? 0.5 : 1,
               }}>
            <div className="flex justify-between items-start mb-1.5">
              <div onClick={() => onShowClick(s)} className="cursor-pointer flex-1">
                <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
                  {s.artist}
                  {s.source === 'search' && (
                    <span className="text-[9px] font-medium px-[5px] py-[1px] rounded" style={{ color: '#0ea5e9', background: 'rgba(14,165,233,0.08)' }}>
                      discovered
                    </span>
                  )}
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
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  {s.venue} · {formatDate(s.date)}{s.endDate ? ` – ${formatDate(s.endDate)}` : ''} · {showTimeStr(s)}
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
            <div className="flex gap-2">
              <button onClick={() => onCycleAttending(s.id)}
                      className={`flex items-center gap-[5px] px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer bg-transparent ${ATTEND_COLORS[s.attending]}`}
                      style={{ border: '1px solid #2d2640' }}>
                <AttendIcon status={s.attending} size={14} />
                {ATTEND_LABELS[s.attending]}
              </button>
              <button onClick={() => onCycleTicket(s.id)}
                      className={`flex items-center gap-[5px] px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer bg-transparent ${TICKET_COLORS[s.ticketStatus]}`}
                      style={{ border: '1px solid #2d2640' }}>
                <Ticket size={14} />
                {TICKET_LABELS[s.ticketStatus]}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
