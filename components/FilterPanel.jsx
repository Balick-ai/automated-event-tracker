'use client';

import { Search, X } from 'lucide-react';
import { ATTEND_STATES, ATTEND_LABELS, TICKET_STATES, TICKET_LABELS } from '@/lib/utils';

export default function FilterPanel({
  searchText, setSearchText,
  filterAttending, setFilterAttending,
  filterTicket, setFilterTicket,
}) {
  return (
    <div className="mt-2.5 p-3 rounded-[10px]" style={{ background: '#12101f', border: '1px solid #1e1b30' }}>
      {/* Search */}
      <div className="flex items-center gap-1.5 mb-2 rounded-lg px-2.5 py-1.5" style={{ background: '#1a1625', border: '1px solid #2d2640' }}>
        <Search size={14} color="#64748b" />
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search artist or venue..."
          className="flex-1 bg-transparent border-none text-[13px] outline-none"
          style={{ color: '#e2e8f0' }}
        />
        {searchText && (
          <button onClick={() => setSearchText('')} className="bg-transparent border-none cursor-pointer p-0.5" style={{ color: '#64748b' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Attending filter */}
      <div className="flex gap-1.5 flex-wrap mb-1.5">
        <span className="text-[11px] w-full mb-0.5" style={{ color: '#64748b' }}>Attending:</span>
        {['all', ...ATTEND_STATES].map(a => (
          <button key={a}
                  onClick={() => setFilterAttending(a)}
                  className="px-2 py-1 text-[11px] rounded-md cursor-pointer font-medium"
                  style={{
                    border: '1px solid',
                    borderColor: filterAttending === a ? '#7c3aed' : '#2d2640',
                    background: filterAttending === a ? 'rgba(124,58,237,0.13)' : 'transparent',
                    color: filterAttending === a ? '#a78bfa' : '#94a3b8',
                  }}>
            {a === 'all' ? 'All' : ATTEND_LABELS[a]}
          </button>
        ))}
      </div>

      {/* Ticket filter */}
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-[11px] w-full mb-0.5" style={{ color: '#64748b' }}>Tickets:</span>
        {['all', ...TICKET_STATES].map(t => (
          <button key={t}
                  onClick={() => setFilterTicket(t)}
                  className="px-2 py-1 text-[11px] rounded-md cursor-pointer font-medium"
                  style={{
                    border: '1px solid',
                    borderColor: filterTicket === t ? '#7c3aed' : '#2d2640',
                    background: filterTicket === t ? 'rgba(124,58,237,0.13)' : 'transparent',
                    color: filterTicket === t ? '#a78bfa' : '#94a3b8',
                  }}>
            {t === 'all' ? 'All' : TICKET_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
