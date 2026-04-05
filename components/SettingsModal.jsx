'use client';

import { useState } from 'react';
import { X, HelpCircle, MapPin, Sparkles, Eye, EyeOff, RefreshCw, ExternalLink, CalendarCheck2, LogOut } from 'lucide-react';
import { isConnected } from '@/lib/calendar';

const FREQUENCY_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: '3days', label: 'Every 3 Days' },
  { value: 'weekly', label: 'Weekly' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'ticketmaster', label: 'Ticketmaster + Eventbrite' },
  { value: 'both', label: 'All (TM + EB + AI)' },
  { value: 'ai', label: 'AI Only' },
];

export default function SettingsModal({ settings, persistSettings, onClose, onShowGuide }) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full max-w-[500px] max-h-[85vh] overflow-auto"
           style={{ background: '#12101f', borderRadius: '16px 16px 0 0', border: '1px solid #1e1b30', borderBottom: 'none' }}>
        {/* Header */}
        <div className="px-4 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
          <h3 className="m-0 text-base font-bold" style={{ color: '#a78bfa' }}>Settings</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Google Calendar connection */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: '#94a3b8' }}>Google Calendar</div>

            {isConnected(settings) ? (
              <>
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg" style={{ background: '#064e3b22', border: '1px solid #064e3b' }}>
                  <CalendarCheck2 size={16} color="#10b981" />
                  <span className="text-xs font-medium" style={{ color: '#10b981' }}>Google Calendar Connected</span>
                  <button onClick={() => persistSettings({ ...settings, googleTokens: null, calendarId: null })}
                          className="ml-auto flex items-center gap-1 text-[11px] rounded-md px-2 py-[3px] cursor-pointer"
                          style={{ color: '#ef4444', background: 'none', border: '1px solid #7f1d1d' }}>
                    <LogOut size={11} /> Disconnect
                  </button>
                </div>
                <div className="mb-2">
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Calendar Name</label>
                  <input value={settings.calendarName || ''}
                         onChange={e => persistSettings({ ...settings, calendarName: e.target.value })}
                         placeholder="EDM Event Tracker"
                         className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                         style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: settings.calendarId ? '#10b981' : '#64748b' }}>
                    {settings.calendarId
                      ? `Calendar: ${settings.calendarName || 'EDM Event Tracker'}`
                      : 'Calendar will be created on first sync'}
                  </div>
                  {settings.calendarId && (
                    <button onClick={() => persistSettings({ ...settings, calendarId: null })}
                            className="text-[11px] rounded-md px-2 py-[3px] cursor-pointer"
                            style={{ color: '#f59e0b', background: 'none', border: '1px solid #92400e' }}>
                      Reset
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] mb-2" style={{ color: '#475569' }}>
                  Connect your Google account to sync shows to a dedicated calendar.
                </div>
                <button onClick={async () => {
                          try {
                            const res = await fetch('/api/auth/google');
                            const data = await res.json();
                            if (data.url) window.location.href = data.url;
                            else alert('Google OAuth not configured');
                          } catch { alert('Failed to start Google sign-in'); }
                        }}
                        className="w-full py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  <CalendarCheck2 size={16} /> Connect Google Calendar
                </button>
              </>
            )}
          </div>

          {/* Reminders */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Event Reminders</div>
                <div className="text-xs" style={{ color: '#64748b' }}>Get notified before synced events</div>
              </div>
              <button onClick={() => persistSettings({ ...settings, reminderEnabled: !settings.reminderEnabled })}
                      className="relative border-none cursor-pointer shrink-0"
                      style={{
                        width: 48, height: 26, borderRadius: 13,
                        background: settings.reminderEnabled !== false ? '#7c3aed' : '#2d2640',
                        transition: 'background 0.2s',
                      }}>
                <div className="absolute rounded-full bg-white"
                     style={{
                       width: 20, height: 20, top: 3,
                       left: settings.reminderEnabled !== false ? 25 : 3,
                       transition: 'left 0.2s',
                     }} />
              </button>
            </div>
            {settings.reminderEnabled !== false && (
              <>
                <div className="mb-2">
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Remind me</label>
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { value: 30, label: '30 min' },
                      { value: 60, label: '1 hour' },
                      { value: 180, label: '3 hours' },
                      { value: 1440, label: '1 day' },
                      { value: 10080, label: '1 week' },
                    ].map(opt => {
                      const active = (settings.reminderMinutes || [1440, 60]).includes(opt.value);
                      return (
                        <button key={opt.value}
                                onClick={() => {
                                  const current = settings.reminderMinutes || [1440, 60];
                                  const next = active
                                    ? current.filter(m => m !== opt.value)
                                    : [...current, opt.value].sort((a, b) => a - b);
                                  if (next.length > 0) persistSettings({ ...settings, reminderMinutes: next });
                                }}
                                className="px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer"
                                style={{
                                  border: '1px solid',
                                  borderColor: active ? '#7c3aed' : '#2d2640',
                                  background: active ? 'rgba(124,58,237,0.13)' : 'transparent',
                                  color: active ? '#a78bfa' : '#64748b',
                                }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Notification type</label>
                  <div className="flex gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #2d2640' }}>
                    {[
                      { value: 'popup', label: 'Popup' },
                      { value: 'email', label: 'Email' },
                      { value: 'both', label: 'Both' },
                    ].map(opt => {
                      const methods = settings.reminderMethods || ['popup'];
                      const active =
                        opt.value === 'both' ? methods.includes('popup') && methods.includes('email') :
                        opt.value === 'popup' ? methods.includes('popup') && !methods.includes('email') :
                        methods.includes('email') && !methods.includes('popup');
                      return (
                        <button key={opt.value}
                                onClick={() => {
                                  const next = opt.value === 'both' ? ['popup', 'email'] : [opt.value];
                                  persistSettings({ ...settings, reminderMethods: next });
                                }}
                                className="flex-1 py-[6px] text-[11px] font-medium cursor-pointer border-none"
                                style={{
                                  background: active ? 'rgba(124,58,237,0.13)' : 'transparent',
                                  color: active ? '#a78bfa' : '#64748b',
                                }}>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sync not going toggle */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Sync &ldquo;not going&rdquo; shows</div>
              <div className="text-xs" style={{ color: '#64748b' }}>Include in bulk calendar sync</div>
            </div>
            <button onClick={() => persistSettings({ ...settings, syncNotGoing: !settings.syncNotGoing })}
                    className="relative border-none cursor-pointer shrink-0"
                    style={{
                      width: 48, height: 26, borderRadius: 13,
                      background: settings.syncNotGoing ? '#7c3aed' : '#2d2640',
                      transition: 'background 0.2s',
                    }}>
              <div className="absolute rounded-full bg-white"
                   style={{
                     width: 20, height: 20, top: 3,
                     left: settings.syncNotGoing ? 25 : 3,
                     transition: 'left 0.2s',
                   }} />
            </button>
          </div>

          <div className="text-xs" style={{ color: '#475569' }}>
            Events sync with known start time + 4hr duration. Unknown times become all-day events.
          </div>

          {/* Location settings */}
          <div>
            <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
              <MapPin size={14} /> Discovery Location
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>City</label>
                <input value={settings.city || ''}
                       onChange={e => persistSettings({ ...settings, city: e.target.value })}
                       placeholder="New York"
                       className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: 80 }}>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>State</label>
                <input value={settings.stateCode || ''}
                       onChange={e => persistSettings({ ...settings, stateCode: e.target.value.toUpperCase().slice(0, 2) })}
                       placeholder="NY"
                       maxLength={2}
                       className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: 80 }}>
                <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Radius (mi)</label>
                <input type="number" value={settings.radius || 25}
                       onChange={e => persistSettings({ ...settings, radius: parseInt(e.target.value) || 25 })}
                       min={5} max={100}
                       className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Auto-Search */}
          <div>
            <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
              <RefreshCw size={14} /> Auto-Search
            </div>
            <div className="text-[11px] mb-2" style={{ color: '#475569' }}>
              Automatically search for new events when you open the app.
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Frequency</label>
                <select value={settings.autoSearchFrequency || 'off'}
                        onChange={e => persistSettings({ ...settings, autoSearchFrequency: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none appearance-auto"
                        style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0' }}>
                  {FREQUENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Search Type</label>
                <select value={settings.autoSearchTypes || 'ticketmaster'}
                        onChange={e => persistSettings({ ...settings, autoSearchTypes: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none appearance-auto"
                        style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0' }}>
                  {SEARCH_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* AI Search / Gemini Key */}
          <div>
            <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
              <Sparkles size={14} /> AI Search
            </div>
            <div className="text-[11px] mb-2" style={{ color: '#475569' }}>
              AI search uses Google Gemini to find events across RA, DICE, edmtrain, and venue sites. You get <strong style={{ color: '#a78bfa' }}>1 free AI search per week</strong>. Add your own Gemini key for unlimited searches.
            </div>
            <div className="mb-2">
              <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>
                Your Gemini API Key (optional — for unlimited AI searches)
              </label>
              <div className="flex gap-1 items-center">
                <input type={showKey ? 'text' : 'password'}
                       value={settings.userGeminiKey || ''}
                       onChange={e => persistSettings({ ...settings, userGeminiKey: e.target.value || null })}
                       placeholder="AIza..."
                       className="flex-1 px-2.5 py-2 rounded-lg text-[13px] outline-none"
                       style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
                <button onClick={() => setShowKey(!showKey)}
                        className="bg-transparent border-none cursor-pointer p-1.5" style={{ color: '#64748b' }}>
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {settings.userGeminiKey && (
                  <button onClick={() => persistSettings({ ...settings, userGeminiKey: null })}
                          className="bg-transparent border-none cursor-pointer p-1" style={{ color: '#64748b' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <a href="https://aistudio.google.com/apikey"
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 text-[11px] no-underline"
               style={{ color: '#a78bfa' }}>
              <ExternalLink size={11} />
              Get a free Gemini API key (30 seconds, no credit card)
            </a>
            {settings.userGeminiKey && (
              <div className="mt-1.5 text-[11px] flex items-center gap-1" style={{ color: '#10b981' }}>
                &#10003; Your key is active — unlimited AI searches
              </div>
            )}
          </div>

          {/* Show Setup Guide */}
          <button onClick={() => { onClose(); onShowGuide?.(); }}
                  className="w-full py-2.5 rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
            <HelpCircle size={14} /> Show Setup Guide
          </button>
        </div>
      </div>
    </div>
  );
}
