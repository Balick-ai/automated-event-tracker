'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Music, Settings, CalendarPlus, Globe, Plus, Calendar, List, Filter, Clock, Loader, Sparkles } from 'lucide-react';
import { getAllShows, saveAllShows, getSettings, saveSettings as persistSettingsDB } from '@/lib/db';
import {
  uid, TICKET_STATES, ATTEND_STATES, ATTEND_LABELS,
  DOT_COLORS, emptyShow, todayStr,
} from '@/lib/utils';
import CalendarView from './CalendarView';
import ListView from './ListView';
import FilterPanel from './FilterPanel';
import EditModal from './EditModal';
import SettingsModal from './SettingsModal';
import DiscoveryQueue from './DiscoveryQueue';

function isDuplicate(discovered, existingShows) {
  const da = discovered.artist.toLowerCase().trim();
  const dd = discovered.date;
  return existingShows.some(s => {
    const ea = s.artist.toLowerCase().trim();
    return s.date === dd && (ea === da || ea.includes(da) || da.includes(ea));
  });
}

export default function EventTracker() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [settings, setSettings] = useState({ syncNotGoing: false, calendarId: null, calendarName: 'Automated Event Tracker', city: 'New York', stateCode: 'NY', radius: 25 });
  const [modal, setModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAttending, setFilterAttending] = useState('all');
  const [filterTicket, setFilterTicket] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState(null);

  // Discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveryQueue, setDiscoveryQueue] = useState(null);
  const [discoveryError, setDiscoveryError] = useState(null);
  const [discoveryWarning, setDiscoveryWarning] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const [lastSearched, setLastSearched] = useState(null);

  // AI Search state
  const [aiSearching, setAiSearching] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

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

  const cycleTicket = useCallback((id, newStatus) => {
    if (newStatus) {
      persist(shows.map(x => x.id === id ? { ...x, ticketStatus: newStatus } : x));
    } else {
      const s = shows.find(x => x.id === id);
      if (!s) return;
      const next = TICKET_STATES[(TICKET_STATES.indexOf(s.ticketStatus) + 1) % TICKET_STATES.length];
      persist(shows.map(x => x.id === id ? { ...x, ticketStatus: next } : x));
    }
  }, [shows, persist]);

  const cycleAttending = useCallback((id, newStatus) => {
    if (newStatus) {
      persist(shows.map(x => x.id === id ? { ...x, attending: newStatus } : x));
    } else {
      const s = shows.find(x => x.id === id);
      if (!s) return;
      const next = ATTEND_STATES[(ATTEND_STATES.indexOf(s.attending) + 1) % ATTEND_STATES.length];
      persist(shows.map(x => x.id === id ? { ...x, attending: next } : x));
    }
  }, [shows, persist]);

  // --- DISCOVERY ---
  const runDiscovery = useCallback(async () => {
    setDiscovering(true);
    setDiscoveryError(null);
    setDiscoveryWarning(null);
    setDiscoveryQueue(null);
    setDismissed(new Set());

    try {
      const params = new URLSearchParams({
        city: settings.city || 'New York',
        stateCode: settings.stateCode || 'NY',
        radius: String(settings.radius || 25),
      });

      const res = await fetch(`/api/events/discover?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      const events = data.events || [];

      if (events.length === 0) {
        setDiscoveryWarning('No events found. Try adjusting your location or radius in Settings.');
      }

      // Build queue with duplicate detection
      const queue = events.map(d => ({
        ...d,
        _duplicate: isDuplicate(d, shows),
        _id: uid(),
      }));

      // Sort: new shows first, then by date
      queue.sort((a, b) => {
        if (a._duplicate !== b._duplicate) return a._duplicate ? 1 : -1;
        return a.date.localeCompare(b.date);
      });

      setDiscoveryQueue(queue);
      if (queue.length > 0) setView('queue');

      // --- Verification: flag unverified tracked shows ---
      const today = todayStr();
      const now = Date.now();
      const updatedShows = shows.map(s => {
        if (s.date < today) return s; // skip past shows
        if (!s.lastVerified && s.source === 'manual') return s; // skip new manual shows

        const found = events.some(d => {
          const da = d.artist.toLowerCase().trim();
          const ea = s.artist.toLowerCase().trim();
          const dateMatch = s.endDate
            ? (d.date >= s.date && d.date <= s.endDate)
            : d.date === s.date;
          return dateMatch && (ea === da || ea.includes(da) || da.includes(ea));
        });

        if (found) {
          return { ...s, lastVerified: now, unverified: false };
        } else {
          return { ...s, unverified: true };
        }
      });
      persist(updatedShows);

      setLastSearched(now);
    } catch (err) {
      setDiscoveryError(err.message || 'Search failed.');
    } finally {
      setDiscovering(false);
    }
  }, [shows, settings, persist]);

  const addDiscoveredShow = useCallback((item) => {
    const source = item._source || 'ticketmaster';
    persist([...shows, {
      id: uid(), date: item.date, endDate: item.endDate, artist: item.artist,
      venue: item.venue, ticketStatus: 'need', attending: 'undecided',
      startTime: item.startTime || null, endTime: item.endTime || null,
      notes: item.notes || '', source, calendarSynced: false,
      calendarEventId: null, lastVerified: Date.now(), unverified: false,
    }]);
    setDiscoveryQueue(q => q ? q.map(d => d._id === item._id ? { ...d, _duplicate: true, _justAdded: true } : d) : q);
  }, [shows, persist]);

  const editAndAddDiscovered = useCallback((item) => {
    const source = item._source || 'ticketmaster';
    setModal({
      id: '', date: item.date, endDate: item.endDate || '', artist: item.artist,
      venue: item.venue, ticketStatus: 'need', attending: 'undecided',
      startTime: item.startTime || '', endTime: item.endTime || '',
      notes: item.notes || '', source, calendarSynced: false,
      calendarEventId: null, lastVerified: Date.now(), unverified: false,
    });
    setDismissed(prev => new Set(prev).add(item._id));
  }, []);

  const addAllNew = useCallback(() => {
    if (!discoveryQueue) return;
    const newItems = discoveryQueue.filter(d => !d._duplicate && !dismissed.has(d._id));
    persist([...shows, ...newItems.map(d => ({
      id: uid(), date: d.date, endDate: d.endDate, artist: d.artist,
      venue: d.venue, ticketStatus: 'need', attending: 'undecided',
      startTime: d.startTime || null, endTime: d.endTime || null,
      notes: d.notes || '', source: d._source || 'ticketmaster', calendarSynced: false,
      calendarEventId: null, lastVerified: Date.now(), unverified: false,
    }))]);
    setDiscoveryQueue(q => q ? q.map(d => ({ ...d, _duplicate: true, _justAdded: !d._duplicate ? true : d._justAdded })) : q);
  }, [discoveryQueue, shows, persist, dismissed]);

  const confirmStillHappening = useCallback((id) => {
    persist(shows.map(s => s.id === id ? { ...s, unverified: false, lastVerified: Date.now() } : s));
  }, [shows, persist]);

  const removeUnverified = useCallback((id) => {
    persist(shows.filter(s => s.id !== id));
  }, [shows, persist]);

  // --- AI SEARCH (server-side via Gemini) ---
  const runAISearch = useCallback(async () => {
    setAiSearching(true);
    setAiStatus('Searching the web with AI...');
    setDiscoveryError(null);

    try {
      const params = new URLSearchParams({
        city: settings.city || 'New York',
        stateCode: settings.stateCode || 'NY',
      });

      const res = await fetch(`/api/events/ai-search?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `AI search error: ${res.status}`);
      }

      const data = await res.json();
      const events = data.events || [];

      // Build queue with duplicate detection (merge with existing queue if present)
      const existingQueue = discoveryQueue || [];
      const existingKeys = new Set(existingQueue.map(d => `${d.artist.toLowerCase().trim()}|${d.date}`));

      const newItems = events
        .filter(d => !existingKeys.has(`${d.artist.toLowerCase().trim()}|${d.date}`))
        .map(d => ({
          ...d,
          _duplicate: isDuplicate(d, shows),
          _id: uid(),
          _source: 'ai',
        }));

      const mergedQueue = [...existingQueue, ...newItems];
      mergedQueue.sort((a, b) => {
        if (a._duplicate !== b._duplicate) return a._duplicate ? 1 : -1;
        return a.date.localeCompare(b.date);
      });

      setDiscoveryQueue(mergedQueue);
      if (mergedQueue.length > 0) setView('queue');
      showToast(`AI search found ${newItems.filter(d => !d._duplicate).length} new events`);

      // Verification
      const today = todayStr();
      const now = Date.now();
      const updatedShows = shows.map(s => {
        if (s.date < today) return s;
        if (!s.lastVerified && s.source === 'manual') return s;
        const found = events.some(d => {
          const da = d.artist.toLowerCase().trim();
          const ea = s.artist.toLowerCase().trim();
          const dateMatch = s.endDate ? (d.date >= s.date && d.date <= s.endDate) : d.date === s.date;
          return dateMatch && (ea === da || ea.includes(da) || da.includes(ea));
        });
        return found ? { ...s, lastVerified: now, unverified: false } : { ...s, unverified: true };
      });
      persist(updatedShows);
      setLastSearched(now);
    } catch (err) {
      setDiscoveryError(err.message || 'AI search failed.');
    } finally {
      setAiSearching(false);
      setAiStatus('');
    }
  }, [shows, settings, persist, discoveryQueue, showToast]);

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
  const newCount = discoveryQueue ? discoveryQueue.filter(d => !d._duplicate && !dismissed.has(d._id)).length : 0;
  const unverifiedShows = useMemo(() => shows.filter(s => s.unverified && s.date >= todayStr()), [shows]);

  const timeAgoStr = (ts) => {
    if (!ts) return null;
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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
            <button onClick={runDiscovery}
                    disabled={discovering || aiSearching}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: discovering ? '#1a1625' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)', opacity: (discovering || aiSearching) ? 0.6 : 1 }}>
              {discovering ? <Loader size={14} className="animate-spin" /> : <Globe size={14} />}
            </button>
            <button onClick={runAISearch}
                    disabled={aiSearching || discovering}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: aiSearching ? '#1a1625' : 'linear-gradient(135deg, #7c3aed, #ec4899)', opacity: (aiSearching || discovering) ? 0.6 : 1 }}>
              {aiSearching ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
            <button onClick={() => setModal(emptyShow())}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Last searched */}
        {lastSearched && !discovering && (
          <div className="flex items-center gap-1 text-[11px] mb-2" style={{ color: '#475569' }}>
            <Clock size={11} /> Last searched: {timeAgoStr(lastSearched)}
          </div>
        )}

        {/* View toggle + filter + queue button */}
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
          {discoveryQueue && !discovering && (
            <button onClick={() => setView('queue')}
                    className="flex items-center gap-[3px] px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                    style={{ background: view === 'queue' ? '#0ea5e9' : '#1a1625', border: '1px solid #2d2640', color: view === 'queue' ? '#fff' : '#0ea5e9' }}>
              <Globe size={13} />
              {newCount > 0 && (
                <span className="rounded-[10px] px-[5px] text-[10px] font-bold text-white" style={{ background: '#0ea5e9' }}>{newCount}</span>
              )}
            </button>
          )}
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

      {/* Discovery loading */}
      {(discovering || aiSearching) && (
        <div className="py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
               style={{ background: aiSearching
                 ? 'linear-gradient(135deg, rgba(124,58,237,0.13), rgba(236,72,153,0.13))'
                 : 'linear-gradient(135deg, rgba(14,165,233,0.13), rgba(6,182,212,0.13))' }}>
            {aiSearching
              ? <Sparkles size={28} color="#a78bfa" className="animate-spin" style={{ animationDuration: '3s' }} />
              : <Globe size={28} color="#0ea5e9" className="animate-spin" style={{ animationDuration: '3s' }} />}
          </div>
          <div className="text-[15px] font-semibold mb-1.5" style={{ color: '#e2e8f0' }}>
            {aiSearching ? 'AI searching the web...' : 'Searching for shows...'}
          </div>
          <div className="text-[13px]" style={{ color: '#64748b' }}>
            {aiSearching ? aiStatus : `Checking Ticketmaster for events near ${settings.city || 'New York'}`}
          </div>
        </div>
      )}

      {/* Discovery error */}
      {discoveryError && !discovering && !aiSearching && (
        <div className="mx-3 my-3 p-4 rounded-[10px] text-center" style={{ background: '#1a0a0a', border: '1px solid #7f1d1d' }}>
          <div className="text-sm mb-2" style={{ color: '#ef4444' }}>{discoveryError}</div>
          <button onClick={runDiscovery}
                  className="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white"
                  style={{ background: '#7c3aed' }}>
            Retry
          </button>
        </div>
      )}

      {/* Discovery Queue */}
      {view === 'queue' && discoveryQueue && !discovering && !aiSearching && (
        <DiscoveryQueue
          queue={discoveryQueue}
          dismissed={dismissed}
          warning={discoveryWarning}
          unverifiedShows={unverifiedShows}
          newCount={newCount}
          onAdd={addDiscoveredShow}
          onEditAndAdd={editAndAddDiscovered}
          onDismiss={(id) => setDismissed(prev => new Set(prev).add(id))}
          onAddAllNew={addAllNew}
          onClose={() => { setDiscoveryQueue(null); setView('calendar'); }}
          onConfirmStillHappening={confirmStillHappening}
          onRemoveUnverified={removeUnverified}
        />
      )}

      {/* Views */}
      {view === 'calendar' && !discovering && !aiSearching && (
        <CalendarView shows={filtered} onShowClick={(s) => setModal({ ...s })} />
      )}
      {view === 'list' && !discovering && !aiSearching && (
        <ListView
          shows={filtered}
          onShowClick={(s) => setModal({ ...s })}
          onCycleAttending={cycleAttending}
          onCycleTicket={cycleTicket}
          syncingShowIds={new Set()}
        />
      )}

      {/* Spacer */}
      {!discovering && !aiSearching && <div className="h-4" />}

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
