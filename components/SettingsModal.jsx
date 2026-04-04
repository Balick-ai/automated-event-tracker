'use client';

import { X, HelpCircle, MapPin } from 'lucide-react';

export default function SettingsModal({ settings, persistSettings, onClose }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center z-50"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full max-w-[500px]"
           style={{ background: '#12101f', borderRadius: '16px 16px 0 0', border: '1px solid #1e1b30', borderBottom: 'none' }}>
        {/* Header */}
        <div className="px-4 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
          <h3 className="m-0 text-base font-bold" style={{ color: '#a78bfa' }}>Settings</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Calendar name */}
          <div>
            <div className="text-[13px] font-semibold mb-2" style={{ color: '#94a3b8' }}>Google Calendar</div>
            <div className="mb-2">
              <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Calendar Name</label>
              <input value={settings.calendarName || ''}
                     onChange={e => persistSettings({ ...settings, calendarName: e.target.value })}
                     placeholder="Automated Event Tracker"
                     className="w-full px-2.5 py-2 rounded-lg text-[13px] outline-none"
                     style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: settings.calendarId ? '#10b981' : '#64748b' }}>
                {settings.calendarId
                  ? `Linked: ${settings.calendarName || 'Automated Event Tracker'}`
                  : 'Not linked yet — will create on first sync'}
              </div>
              {settings.calendarId && (
                <button onClick={() => persistSettings({ ...settings, calendarId: null })}
                        className="text-[11px] rounded-md px-2 py-[3px] cursor-pointer"
                        style={{ color: '#ef4444', background: 'none', border: '1px solid #7f1d1d' }}>
                  Reset Link
                </button>
              )}
            </div>
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
            Events sync with known start time + 4hr duration. Unknown times become all-day events. Changing the calendar name and resetting the link will create a new calendar on the next sync.
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
            <div className="text-[11px]" style={{ color: '#475569' }}>
              Used for Discover searches. Default: New York, NY, 25 miles.
            </div>
          </div>

          {/* Show Setup Guide */}
          <button className="w-full py-2.5 rounded-[10px] text-[13px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
            <HelpCircle size={14} /> Show Setup Guide
          </button>
        </div>
      </div>
    </div>
  );
}
