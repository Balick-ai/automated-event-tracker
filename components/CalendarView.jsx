'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, CalendarCheck2, Loader } from 'lucide-react';
import {
  MONTHS, DAYS_HDR, DOT_COLORS, ATTEND_INLINE_COLORS, ATTEND_LABELS, SOURCE_LABELS,
  getCalendarDays, dateStr, showOnDate, formatDate, showTimeStr,
} from '@/lib/utils';

export default function CalendarView({ shows, onShowClick }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const calDays = useMemo(() => getCalendarDays(year, month), [year, month]);
  const showsForDate = useCallback((ds) => shows.filter(s => showOnDate(s, ds)), [shows]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <div className="p-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth}
                className="rounded-lg cursor-pointer px-2.5 py-1.5"
                style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <h2 className="text-[17px] font-semibold m-0" style={{ color: '#e2e8f0' }}>
            {MONTHS[month]} {year}
          </h2>
          {!isCurrentMonth && (
            <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
                    className="rounded-md cursor-pointer px-2 py-[3px] text-[11px] font-semibold"
                    style={{ background: '#7c3aed22', border: '1px solid #7c3aed44', color: '#a78bfa' }}>
              Today
            </button>
          )}
        </div>
        <button onClick={nextMonth}
                className="rounded-lg cursor-pointer px-2.5 py-1.5"
                style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_HDR.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold p-1" style={{ color: '#475569' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {calDays.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const ds = dateStr(year, month, day);
          const dayShows = showsForDate(ds);
          const isSelected = selectedDate === ds;
          const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
          const isPast = new Date(ds) < new Date(now.toDateString());

          return (
            <button key={ds}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className="flex flex-col items-center gap-[3px] cursor-pointer rounded-lg min-h-[52px] px-0.5 py-1.5"
                    style={{
                      background: isSelected ? '#1e1635' : '#0f0d1a',
                      border: isSelected ? '1px solid #7c3aed' : isToday ? '1px solid rgba(167,139,250,0.27)' : '1px solid #1a1625',
                      opacity: isPast ? 0.5 : 1,
                    }}>
              <span className="text-[13px]" style={{ fontWeight: isToday ? 700 : 400, color: isToday ? '#a78bfa' : '#cbd5e1' }}>
                {day}
              </span>
              <div className="flex gap-[3px] flex-wrap justify-center">
                {dayShows.slice(0, 3).map(s => (
                  <div key={s.id} className="rounded-full" style={{ width: 7, height: 7, background: DOT_COLORS[s.attending] }} />
                ))}
                {dayShows.length > 3 && <span className="text-[8px]" style={{ color: '#94a3b8' }}>+{dayShows.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded date details */}
      {selectedDate && (
        <div className="mt-3 rounded-xl overflow-hidden" style={{ background: '#12101f', border: '1px solid #1e1b30' }}>
          <div className="px-3.5 py-2.5 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
            <span className="text-sm font-semibold" style={{ color: '#a78bfa' }}>{formatDate(selectedDate)}</span>
            <button onClick={() => setSelectedDate(null)} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
              <X size={16} />
            </button>
          </div>
          {showsForDate(selectedDate).length === 0 ? (
            <div className="py-5 text-center text-[13px]" style={{ color: '#475569' }}>No shows</div>
          ) : (
            showsForDate(selectedDate).map(s => (
              <div key={s.id} onClick={() => onShowClick(s)}
                   className="px-3.5 py-2.5 cursor-pointer" style={{ borderBottom: '1px solid #1a1625' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#e2e8f0' }}>
                      {s.artist}
                      {s.calendarSynced && <CalendarCheck2 size={12} color="#f59e0b" />}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      {s.venue} · {showTimeStr(s)}
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-[3px] rounded-md font-medium shrink-0"
                        style={{ color: ATTEND_INLINE_COLORS[s.attending]?.color, background: ATTEND_INLINE_COLORS[s.attending]?.bg }}>
                    {ATTEND_LABELS[s.attending]}
                  </span>
                </div>
                {s.notes && (
                  <div className="text-xs mt-1.5 whitespace-pre-wrap leading-relaxed" style={{ color: '#94a3b8' }}>{s.notes}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
