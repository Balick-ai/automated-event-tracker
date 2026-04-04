'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Music, Settings, CalendarPlus, Globe, Plus, Calendar, List, Filter, Clock, Loader } from 'lucide-react';
import { getAllShows, saveAllShows, getSettings, saveSettings as persistSettingsDB } from '@/lib/db';
import {
  uid, TICKET_STATES, TICKET_LABELS, ATTEND_STATES, ATTEND_LABELS,
  ATTEND_COLORS, DOT_COLORS, emptyShow, todayStr,
} from '@/lib/utils';
import CalendarView from './CalendarView';
import ListView from './ListView';
import FilterPanel from './FilterPanel';
import EditModal from './EditModal';
import SettingsModal from './SettingsModal';

export default function EventTracker() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [settings, setSettings] = useState({ syncNotGoing: false, calendarId: null, calendarName: 'Automated Event Tracker' });
  const [modal, setModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAttending, setFilterAttending] = useState('all');
  const [filterTicket, setFilterTicket] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState(null);

  // Load data on mount
  useEffect(() => {
    (async () => {
      try {
        const [loadedShows, loadedSettings] = await Promise.all([getAllShows(), getSettings()]);
        setShows(loadedShows || []);
        setSettings(loadedSettings);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
      setLoading(false);
    })();
  }, []);

  // Persist shows
  const persist = useCallback(async (next) => {
    setShows(next);
    try { await saveAllShows(next); } catch (e) { console.error('Failed to save shows:', e); }
  }, []);

  // Persist settings
  const persistSettings = useCallback(async (next) => {
    setSettings(next);
    try { await persistSettingsDB(next); } catch (e) { console.error('Failed to save settings:', e); }
  }, []);

  // CRUD
  const saveShow = useCallback((show) => {
    if (show.id && shows.find(s => s.id === show.id)) {
      persist(shows.map(s => s.id === show.id ? show : s));
    } else {
      persist([...shows, { ...show, id: uid(), calendarSynced: false, calendarEventId: null, lastVerified: null, unverified: false }]);
    }
    setModal(null);
  }, [shows, persist]);

  const deleteShow = useCallback((id) => {
    if (!confirm('Delete this show?')) return;
    persist(shows.filter(s => s.id !== id));
    setModal(null);
  }, [shows, persist]);

  const cycleTicket = useCallback((id) => {
    const s = shows.find(x => x.id === id);
    if (!s) return;
    const newStatus = TICKET_STATES[(TICKET_STATES.indexOf(s.ticketStatus) + 1) % TICKET_STATES.length];
    persist(shows.map(x => x.id === id ? { ...x, ticketStatus: newStatus } : x));
  }, [shows, persist]);

  const cycleAttending = useCallback((id) => {
    const s = shows.find(x => x.id === id);
    if (!s) return;
    const newStatus = ATTEND_STATES[(ATTEND_STATES.indexOf(s.attending) + 1) % ATTEND_STATES.length];
    persist(shows.map(x => x.id === id ? { ...x, attending: newStatus } : x));
  }, [shows, persist]);

  // Filtering
  const filtered = useMemo(() => shows.filter(s => {
    if (filterAttending !== 'all' && s.attending !== filterAttending) return false;
    if (filterTicket !== 'all' && s.ticketStatus !== filterTicket) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!s.artist.toLowerCase().includes(q) && !s.venue.toLowerCase().includes(q) && !(s.notes || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [shows, filterAttending, filterTicket, searchText]);

  const unsyncedCount = shows.filter(s => !s.calendarSynced && (s.attending !== 'not going' || settings.syncNotGoing)).length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="text-purple-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium"
             style={{ background: '#1e1635', border: '1px solid #7c3aed', color: '#a78bfa' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1025 0%, #0f0a1a 50%, #0a1628 100%)', borderBottom: '1px solid #1e1b30' }}
           className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>
              <Music size={20} color="#fff" />
            </div>
            <div>
              <h1 className="text-xl font-bold m-0"
                  style={{ background: 'linear-gradient(90deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Automated Event Tracker
              </h1>
              <div className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{shows.length} shows tracked</div>
            </div>
          </div>
          <div className="flex gap-[5px]">
            <button onClick={() => setSettingsOpen(true)}
                    className="flex items-center rounded-lg p-2 cursor-pointer"
                    style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
              <Settings size={16} />
            </button>
            <button onClick={() => showToast('Calendar sync coming soon!')}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <CalendarPlus size={14} />
              {unsyncedCount > 0 && (
                <span className="rounded-lg px-[5px] text-[10px]" style={{ background: 'rgba(255,255,255,0.2)' }}>{unsyncedCount}</span>
              )}
            </button>
            <button onClick={() => showToast('Event discovery coming soon!')}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
              <Globe size={14} />
            </button>
            <button onClick={() => setModal(emptyShow())}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* View toggle + filter */}
        <div className="flex gap-1.5 items-center flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ background: '#1a1625', border: '1px solid #2d2640' }}>
            <button onClick={() => setView('calendar')}
                    className="flex items-center gap-[3px] px-3 py-1.5 text-xs border-none cursor-pointer font-medium"
                    style={{ background: view === 'calendar' ? '#7c3aed' : 'transparent', color: view === 'calendar' ? '#fff' : '#94a3b8' }}>
              <Calendar size={13} /> Cal
            </button>
            <button onClick={() => setView('list')}
                    className="flex items-center gap-[3px] px-3 py-1.5 text-xs border-none cursor-pointer font-medium"
                    style={{ background: view === 'list' ? '#7c3aed' : 'transparent', color: view === 'list' ? '#fff' : '#94a3b8' }}>
              <List size={13} /> List
            </button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{ background: showFilters ? '#7c3aed' : '#1a1625', border: '1px solid #2d2640', color: showFilters ? '#fff' : '#94a3b8' }}>
            <Filter size={13} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <FilterPanel
            searchText={searchText}
            setSearchText={setSearchText}
            filterAttending={filterAttending}
            setFilterAttending={setFilterAttending}
            filterTicket={filterTicket}
            setFilterTicket={setFilterTicket}
          />
        )}
      </div>

      {/* Views */}
      {view === 'calendar' && (
        <CalendarView shows={filtered} onShowClick={(s) => setModal({ ...s })} />
      )}
      {view === 'list' && (
        <ListView
          shows={filtered}
          onShowClick={(s) => setModal({ ...s })}
          onCycleAttending={cycleAttending}
          onCycleTicket={cycleTicket}
          syncingShowIds={new Set()}
        />
      )}

      {/* Legend */}
      <div className="px-4 py-3 flex justify-between items-center flex-wrap gap-2" style={{ borderTop: '1px solid #1a1625' }}>
        <div className="flex gap-2.5 flex-wrap">
          {ATTEND_STATES.map(a => (
            <div key={a} className="flex items-center gap-1 text-[11px]" style={{ color: '#64748b' }}>
              <div className={`w-2 h-2 rounded-full ${DOT_COLORS[a]}`} />
              {ATTEND_LABELS[a]}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {modal && (
        <EditModal
          show={modal}
          setModal={setModal}
          onSave={saveShow}
          onDelete={deleteShow}
          isExisting={!!(modal.id && shows.find(s => s.id === modal.id))}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          persistSettings={persistSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
