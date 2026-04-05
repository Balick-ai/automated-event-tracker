'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Music, Settings, CalendarPlus, Globe, Plus, Calendar, List, Filter, Clock, Loader, Sparkles, X } from 'lucide-react';
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
import AILimitModal from './AILimitModal';
import SyncProgressModal from './SyncProgressModal';
import OnboardingModal from './OnboardingModal';
import { isConnected, syncShowToCalendar, deleteShowFromCalendar, syncAllShows } from '@/lib/calendar';
import { getVenuesForCity } from '@/lib/venues';

const AI_SEARCH_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

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
  const [settings, setSettings] = useState({ syncNotGoing: false, calendarId: null, calendarName: 'EDM Event Tracker', city: 'New York', stateCode: 'NY', radius: 25 });
  const [modal, setModal] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAttending, setFilterAttending] = useState('all');
  const [filterTicket, setFilterTicket] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [toast, setToast] = useState(null);
  const [searchBanner, setSearchBanner] = useState(null);
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const [showDateTip, setShowDateTip] = useState(false);

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
  const [showAILimit, setShowAILimit] = useState(false);

  // Calendar sync state
  const [syncingShowIds, setSyncingShowIds] = useState(new Set());
  const [bulkSyncProgress, setBulkSyncProgress] = useState(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load data on mount
  const [autoSearchDone, setAutoSearchDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let [loadedShows, loadedSettings] = await Promise.all([getAllShows(), getSettings()]);
        setShows(loadedShows || []);

        // Check for Google OAuth tokens in URL hash
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);

          if (params.get('google_tokens')) {
            try {
              const tokens = JSON.parse(atob(params.get('google_tokens')));
              loadedSettings = { ...loadedSettings, googleTokens: tokens };
              await persistSettingsDB(loadedSettings);
              window.history.replaceState(null, '', window.location.pathname);
            } catch (e) {
              console.error('Failed to parse Google tokens:', e);
            }
          } else if (params.get('google_error')) {
            console.error('Google OAuth error:', params.get('google_error'));
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        setSettings(loadedSettings);

        // Show onboarding on first visit
        if (!loadedSettings.onboardingCompleted) {
          setShowOnboarding(true);
        }
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
  const saveShow = useCallback(async (show) => {
    if (show.id && shows.find(s => s.id === show.id)) {
      persist(shows.map(s => s.id === show.id ? show : s));
      // Auto-update calendar if synced
      if (show.calendarSynced && show.calendarEventId && isConnected(settings)) {
        try {
          const updated = await syncShowToCalendar(show, settings, persistSettings);
          persist(shows.map(s => s.id === show.id ? updated : s));
        } catch (e) { console.error('Calendar update failed:', e); }
      }
    } else {
      persist([...shows, { ...show, id: uid(), calendarSynced: false, calendarEventId: null, lastVerified: null, unverified: false }]);
    }
    setModal(null);
  }, [shows, persist, settings, persistSettings]);

  const deleteShow = useCallback(async (id) => {
    if (!confirm('Delete this show?')) return;
    const show = shows.find(s => s.id === id);
    // Auto-delete from calendar if synced
    if (show?.calendarSynced && show?.calendarEventId && isConnected(settings)) {
      try { await deleteShowFromCalendar(show, settings, persistSettings); } catch (e) { console.error('Calendar delete failed:', e); }
    }
    persist(shows.filter(s => s.id !== id));
    setModal(null);
  }, [shows, persist, settings, persistSettings]);

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

  const cycleAttending = useCallback(async (id, newStatus) => {
    const s = shows.find(x => x.id === id);
    if (!s) return;
    const next = newStatus || ATTEND_STATES[(ATTEND_STATES.indexOf(s.attending) + 1) % ATTEND_STATES.length];

    // If changing to "not going" and syncNotGoing is off, remove from calendar
    if (next === 'not going' && !settings.syncNotGoing && s.calendarSynced && s.calendarEventId && isConnected(settings)) {
      const cleared = { ...s, attending: next, calendarSynced: false, calendarEventId: null };
      persist(shows.map(x => x.id === id ? cleared : x));
      try { await deleteShowFromCalendar(s, settings, persistSettings); } catch (e) { console.error('Calendar delete failed:', e); }
    } else {
      const updated = { ...s, attending: next };
      persist(shows.map(x => x.id === id ? updated : x));
      // Auto-update calendar if synced
      if (s.calendarSynced && s.calendarEventId && isConnected(settings)) {
        try { await syncShowToCalendar(updated, settings, persistSettings); } catch (e) { console.error('Calendar update failed:', e); }
      }
    }
  }, [shows, persist, settings, persistSettings]);

  // --- CALENDAR SYNC ---
  const handleSyncShow = useCallback(async (id) => {
    if (!isConnected(settings)) {
      showToast('Connect Google Calendar in Settings first');
      return;
    }
    const show = shows.find(s => s.id === id);
    if (!show) return;

    setSyncingShowIds(prev => new Set(prev).add(id));
    try {
      const synced = await syncShowToCalendar(show, settings, persistSettings);
      persist(shows.map(s => s.id === id ? synced : s));
      showToast(`${show.artist} synced to calendar`);
    } catch (err) {
      showToast(err.message || 'Sync failed');
    }
    setSyncingShowIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [shows, settings, persist, persistSettings, showToast]);

  const handleBulkSync = useCallback(async () => {
    if (!isConnected(settings)) {
      showToast('Connect Google Calendar in Settings first');
      return;
    }
    setIsBulkSyncing(true);
    setBulkSyncProgress({ current: 0, total: 0, results: [] });

    try {
      const updated = await syncAllShows(shows, settings, persistSettings, (progress) => {
        setBulkSyncProgress(progress);
      });
      persist(updated);
    } catch (err) {
      showToast(err.message || 'Bulk sync failed');
    }
    setIsBulkSyncing(false);
  }, [shows, settings, persist, persistSettings, showToast]);

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
      if (searchDateFrom) params.set('dateFrom', searchDateFrom);
      if (searchDateTo) params.set('dateTo', searchDateTo);

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

  const canUseAISearch = useCallback(() => {
    if (settings.userGeminiKey) return true; // own key = no limit
    if (!settings.lastAISearch) return true; // never searched
    return Date.now() - settings.lastAISearch >= AI_SEARCH_COOLDOWN;
  }, [settings]);

  const nextAISearchAvailable = useCallback(() => {
    if (!settings.lastAISearch) return Date.now();
    return settings.lastAISearch + AI_SEARCH_COOLDOWN;
  }, [settings]);

  // --- AI SEARCH (server-side via Gemini) ---
  const runAISearch = useCallback(async (skipRateCheck = false) => {
    // Rate limit check (skip if user has own key or if called from auto-search with override)
    if (!skipRateCheck && !canUseAISearch()) {
      setShowAILimit(true);
      return;
    }

    setAiSearching(true);
    setAiStatus('Searching the web with AI...');
    setDiscoveryError(null);

    try {
      const res = await fetch('/api/events/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: settings.city || 'New York',
          stateCode: settings.stateCode || 'NY',
          geminiKey: settings.userGeminiKey || undefined,
          dateFrom: searchDateFrom || undefined,
          dateTo: searchDateTo || undefined,
        }),
      });
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
      const newCount = newItems.filter(d => !d._duplicate).length;
      if (newCount > 0) {
        setSearchBanner({ message: `AI search found ${newCount} new event${newCount !== 1 ? 's' : ''}`, type: 'ai' });
      } else {
        showToast('AI search complete — no new events found');
      }

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
      // Track AI search usage for rate limiting
      persistSettings({ ...settings, lastAISearch: now });
    } catch (err) {
      setDiscoveryError(err.message || 'AI search failed.');
    } finally {
      setAiSearching(false);
      setAiStatus('');
    }
  }, [shows, settings, persist, persistSettings, discoveryQueue, showToast, canUseAISearch]);

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
  const unverifiedShows = useMemo(() => shows.filter(s => {
    if (!s.unverified) return false;
    if (s.date < todayStr()) return false;
    // If date range filter is active, only show unverified within that range
    if (searchDateFrom && s.date < searchDateFrom) return false;
    if (searchDateTo && s.date > searchDateTo) return false;
    return true;
  }), [shows, searchDateFrom, searchDateTo]);

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

  // Auto-search on app open
  useEffect(() => {
    if (loading || autoSearchDone) return;
    if (settings.autoSearchFrequency === 'off') { setAutoSearchDone(true); return; }

    const freqMs = {
      daily: 24 * 60 * 60 * 1000,
      '3days': 3 * 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    };

    const interval = freqMs[settings.autoSearchFrequency];
    if (!interval) { setAutoSearchDone(true); return; }

    const lastAuto = settings.lastAutoSearch || 0;
    if (Date.now() - lastAuto < interval) { setAutoSearchDone(true); return; }

    // Time to auto-search
    setAutoSearchDone(true);
    const types = settings.autoSearchTypes || 'ticketmaster';

    (async () => {
      if (types === 'ticketmaster' || types === 'both') {
        try { await runDiscovery(); } catch { /* silent */ }
      }
      if (types === 'ai' || types === 'both') {
        if (canUseAISearch()) {
          try { await runAISearch(true); } catch { /* silent */ }
        }
      }
      persistSettings({ ...settings, lastAutoSearch: Date.now() });
      showToast('Auto-search complete');
    })();
  }, [loading, autoSearchDone, settings, runDiscovery, runAISearch, canUseAISearch, persistSettings, showToast]);

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

      {/* Search complete banner */}
      {searchBanner && view !== 'queue' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px]">
          <button onClick={() => { setView('queue'); setSearchBanner(null); }}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer border-none text-white flex items-center justify-center gap-2"
                  style={{
                    background: searchBanner.type === 'ai'
                      ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
                      : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
            <Sparkles size={16} />
            {searchBanner.message} — tap to view
          </button>
          <button onClick={() => setSearchBanner(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs cursor-pointer border-none"
                  style={{ background: '#1e1b30', color: '#94a3b8' }}>
            ✕
          </button>
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
                EDM Event Tracker
              </h1>
              <div className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>
                {shows.length} shows tracked · {settings.city || 'New York'}{settings.stateCode ? `, ${settings.stateCode}` : ''}
              </div>
            </div>
          </div>
          <div className="flex gap-[5px]">
            <button onClick={() => setSettingsOpen(true)}
                    className="flex items-center rounded-lg p-2 cursor-pointer"
                    style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
              <Settings size={16} />
            </button>
            <button onClick={handleBulkSync}
                    disabled={isBulkSyncing}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: isBulkSyncing ? '#1a1625' : 'linear-gradient(135deg, #f59e0b, #d97706)', opacity: isBulkSyncing ? 0.6 : 1 }}>
              {isBulkSyncing ? <Loader size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
              {!isBulkSyncing && unsyncedCount > 0 && (
                <span className="rounded-lg px-[5px] text-[10px]" style={{ background: 'rgba(255,255,255,0.2)' }}>{unsyncedCount}</span>
              )}
            </button>
            <button onClick={() => setModal(emptyShow())}
                    className="flex items-center gap-[3px] rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer border-none text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* View toggle + filter */}
        <div className="flex gap-1.5 items-center flex-wrap mt-3">
          <div className="flex rounded-lg overflow-hidden" style={{ background: '#1a1625', border: '1px solid #2d2640' }}>
            <button onClick={() => setView('calendar')}
                    className="flex items-center gap-[3px] px-3 py-1.5 text-xs border-none cursor-pointer font-medium"
                    style={{ background: view === 'calendar' ? '#7c3aed' : 'transparent', color: view === 'calendar' ? '#fff' : '#94a3b8' }}>
              <Calendar size={13} /> Calendar
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

      {/* Searches bar */}
      <div className="px-4 py-2" style={{ borderBottom: '1px solid #1e1b30', background: '#0d0b18' }}>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            <button onClick={runDiscovery}
                    disabled={discovering || aiSearching}
                    className="flex items-center gap-[4px] rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer border-none text-white"
                    style={{ background: discovering ? '#1a1625' : 'linear-gradient(135deg, #0ea5e9, #06b6d4)', opacity: (discovering || aiSearching) ? 0.6 : 1 }}>
              {discovering ? <Loader size={12} className="animate-spin" /> : <Globe size={12} />}
              Discover
            </button>
            <button onClick={runAISearch}
                    disabled={aiSearching || discovering}
                    className="flex items-center gap-[4px] rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer border-none text-white"
                    style={{ background: aiSearching ? '#1a1625' : 'linear-gradient(135deg, #7c3aed, #ec4899)', opacity: (aiSearching || discovering) ? 0.6 : 1 }}>
              {aiSearching ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Search
            </button>
            {discoveryQueue && !discovering && !aiSearching && (
              <button onClick={() => { setView('queue'); setSearchBanner(null); }}
                      className="flex items-center gap-[4px] rounded-lg px-2.5 py-1 text-[11px] font-medium cursor-pointer"
                      style={{ background: view === 'queue' ? '#0ea5e9' : '#1a1625', border: '1px solid #2d2640', color: view === 'queue' ? '#fff' : '#e2e8f0' }}>
                Results
                {newCount > 0 && (
                  <span className="rounded-full px-[5px] text-[9px] font-bold text-white" style={{ background: '#0ea5e9' }}>{newCount}</span>
                )}
              </button>
            )}
          </div>
          {lastSearched && !discovering && !aiSearching && (
            <span className="text-[10px]" style={{ color: '#475569' }}>
              {timeAgoStr(lastSearched)}
            </span>
          )}
        </div>

        {/* Date range filter — always visible */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-semibold" style={{ color: '#64748b' }}>From</label>
            <input type="date" value={searchDateFrom}
                   onChange={e => setSearchDateFrom(e.target.value)}
                   className="px-2 py-1 rounded-md text-[11px] outline-none"
                   style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0' }} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-semibold" style={{ color: '#64748b' }}>To</label>
            <input type="date" value={searchDateTo}
                   onChange={e => setSearchDateTo(e.target.value)}
                   className="px-2 py-1 rounded-md text-[11px] outline-none"
                   style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0' }} />
          </div>
          {(searchDateFrom || searchDateTo) ? (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: '#a78bfa', background: '#7c3aed22' }}>Filtered</span>
              <button onClick={() => { setSearchDateFrom(''); setSearchDateTo(''); }}
                      className="bg-transparent border-none cursor-pointer p-0.5" style={{ color: '#64748b' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="relative ml-auto">
              <button onClick={() => setShowDateTip(!showDateTip)}
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer border-none"
                      style={{ background: showDateTip ? '#7c3aed' : '#2d2640', color: showDateTip ? '#fff' : '#94a3b8' }}>
                i
              </button>
              {showDateTip && (
                <div className="absolute bottom-full right-0 mb-1.5 px-3 py-2 rounded-lg text-[11px] leading-snug w-[200px] z-10"
                     style={{ background: '#1e1635', border: '1px solid #7c3aed', color: '#e2e8f0' }}>
                  Optional date range filter. If no dates are set, searches default to 6 months in advance.
                </div>
              )}
            </div>
          )}
        </div>
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
          hasVenues={!!getVenuesForCity(settings.city)}
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
          onSyncShow={handleSyncShow}
          syncingShowIds={syncingShowIds}
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
          onSyncShow={handleSyncShow}
          syncing={syncingShowIds.has(modal?.id)}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          settings={settings}
          persistSettings={persistSettings}
          onClose={() => setSettingsOpen(false)}
          onShowGuide={() => setShowOnboarding(true)}
        />
      )}

      {/* Sync Progress Modal */}
      {bulkSyncProgress && (
        <SyncProgressModal
          syncing={isBulkSyncing}
          progress={bulkSyncProgress}
          onClose={() => setBulkSyncProgress(null)}
        />
      )}

      {/* AI Limit Modal */}
      {showAILimit && (
        <AILimitModal
          nextAvailable={nextAISearchAvailable()}
          onClose={() => setShowAILimit(false)}
          onSaveKey={(key) => {
            persistSettings({ ...settings, userGeminiKey: key });
            setShowAILimit(false);
            setTimeout(() => runAISearch(true), 100);
          }}
        />
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false);
            persistSettings({ ...settings, onboardingCompleted: true });
          }}
        />
      )}
    </div>
  );
}
