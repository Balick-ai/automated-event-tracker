'use client';

import { useState } from 'react';
import {
  Music, List, Globe, CalendarPlus, Settings, Plus, Sparkles,
  Smartphone, Shield, AlertTriangle, CalendarCheck2, ChevronRight,
} from 'lucide-react';

const SCREENS = [
  // 0: Welcome
  function Welcome() {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 flex-1">
        <div className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center mb-6"
             style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)' }}>
          <Music size={36} color="#fff" />
        </div>
        <h1 className="text-[26px] font-extrabold mb-3 m-0"
            style={{ background: 'linear-gradient(90deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EDM Event Tracker
        </h1>
        <p className="text-base m-0 max-w-[300px] leading-relaxed" style={{ color: '#94a3b8' }}>
          Track live music events, discover upcoming shows, and sync everything to Google Calendar.
        </p>
        <p className="text-sm mt-6 m-0" style={{ color: '#64748b' }}>
          Let&apos;s get you set up in under a minute.
        </p>
      </div>
    );
  },

  // 1: How It Works
  function HowItWorks() {
    const features = [
      { icon: <List size={22} color="#a78bfa" />, bg: '#7c3aed22', title: 'Track', desc: 'Add shows, set your attendance and ticket status' },
      { icon: <Globe size={22} color="#0ea5e9" />, bg: '#0ea5e922', title: 'Discover', desc: 'Search Ticketmaster + AI for upcoming electronic shows near you' },
      { icon: <CalendarPlus size={22} color="#f59e0b" />, bg: '#f59e0b22', title: 'Sync', desc: 'Push shows to a dedicated Google Calendar with one tap' },
    ];
    return (
      <div className="px-6 flex-1">
        <h2 className="text-xl font-bold mb-5 m-0" style={{ color: '#e2e8f0' }}>How It Works</h2>
        <div className="flex flex-col gap-4">
          {features.map(f => (
            <div key={f.title} className="flex gap-3.5 items-start">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.bg }}>{f.icon}</div>
              <div>
                <div className="text-[15px] font-bold mb-0.5" style={{ color: '#e2e8f0' }}>{f.title}</div>
                <div className="text-[13px] leading-snug" style={{ color: '#94a3b8' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  // 2: Your Controls
  function Controls() {
    const items = [
      { icon: <Settings size={16} />, bg: '#1a1625', border: '#2d2640', label: 'Settings', desc: 'Calendar, location, search preferences' },
      { icon: <CalendarPlus size={16} />, bg: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'transparent', label: 'Sync All', desc: 'Push all shows to Google Calendar', light: true },
      { icon: <Plus size={16} />, bg: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'transparent', label: 'Add Show', desc: 'Manually add a show', light: true },
    ];
    const searches = [
      { icon: <Globe size={14} />, bg: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', label: 'Discover', desc: 'Free Ticketmaster search' },
      { icon: <Sparkles size={14} />, bg: 'linear-gradient(135deg, #7c3aed, #ec4899)', label: 'AI Search', desc: 'Searches RA, DICE, edmtrain + more' },
    ];
    return (
      <div className="px-6 flex-1">
        <h2 className="text-xl font-bold mb-5 m-0" style={{ color: '#e2e8f0' }}>Your Controls</h2>
        <div className="flex flex-col gap-2.5 mb-4">
          {items.map(item => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]" style={{ background: '#12101f', border: '1px solid #1e1b30' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: item.bg, border: `1px solid ${item.border}`, color: item.light ? '#fff' : '#94a3b8' }}>{item.icon}</div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{item.label}</div>
                <div className="text-[12px]" style={{ color: '#64748b' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Searches</div>
        <div className="flex gap-2">
          {searches.map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: s.bg }}>
              {s.icon} {s.label}
            </div>
          ))}
        </div>
        <p className="text-[12px] mt-3" style={{ color: '#475569' }}>
          In list view, tap the status buttons to quickly change attending or ticket status.
        </p>
      </div>
    );
  },

  // 3: AI Search + Gemini Key
  function AISearch() {
    return (
      <div className="px-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))' }}>
            <Sparkles size={22} color="#a78bfa" />
          </div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>AI Search</h2>
        </div>
        <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>
          The <strong style={{ color: '#a78bfa' }}>AI Search</strong> button uses Google Gemini to find events on Resident Advisor, DICE, edmtrain, Songkick, and venue websites &mdash; events that Ticketmaster misses.
        </p>
        <div className="p-3 rounded-xl mb-4" style={{ background: '#1a1625' }}>
          <div className="text-[13px] font-semibold mb-1" style={{ color: '#e2e8f0' }}>You get 1 free AI search per week</div>
          <div className="text-[12px]" style={{ color: '#94a3b8' }}>
            Want unlimited? Add your own free Gemini API key:
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-3">
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#ec4899', color: '#fff' }}>1</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>
              Go to{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                 style={{ color: '#a78bfa', textDecoration: 'underline', fontWeight: 600 }}>
                aistudio.google.com/apikey
              </a>
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#ec4899', color: '#fff' }}>2</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>
              Click <strong>Create API Key</strong> (no credit card needed)
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#ec4899', color: '#fff' }}>3</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>
              Copy the key (starts with <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#12101f', color: '#a78bfa' }}>AIza...</code>)
            </div>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#ec4899', color: '#fff' }}>4</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>
              Paste in <strong>Settings</strong> &rarr; <strong>AI Search</strong> &rarr; <strong>Your Gemini API Key</strong>
            </div>
          </div>
        </div>

        <p className="text-[11px]" style={{ color: '#475569' }}>
          This is optional &mdash; you can always do it later in Settings. Your key stays in your browser and is never shared.
        </p>
      </div>
    );
  },

  // 4: Connect Google Calendar (interactive)
  function ConnectCalendar() {
    return (
      <div className="px-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#f59e0b22' }}>
            <CalendarPlus size={22} color="#f59e0b" />
          </div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>Connect Google Calendar</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
          Link your Google account to sync shows to a dedicated calendar. You can skip this and do it later in Settings.
        </p>

        <button onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/google');
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch { /* silent */ }
                }}
                className="w-full py-3 rounded-xl text-[15px] font-bold cursor-pointer border-none text-white flex items-center justify-center gap-2 mb-4"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
          <CalendarCheck2 size={18} /> Connect Google Calendar
        </button>

        <div className="flex flex-col gap-3 p-4 rounded-xl mb-3" style={{ background: '#1a1625' }}>
          <div className="text-[13px] font-semibold" style={{ color: '#94a3b8' }}>What happens when you connect:</div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#f59e0b', color: '#000' }}>1</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>Sign in with your Google account</div>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#f59e0b', color: '#000' }}>2</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>Approve calendar access</div>
          </div>
          <div className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                 style={{ background: '#f59e0b', color: '#000' }}>3</div>
            <div className="text-[13px]" style={{ color: '#e2e8f0' }}>A dedicated <strong style={{ color: '#f59e0b' }}>EDM Event Tracker</strong> calendar is created</div>
          </div>
        </div>

        <p className="text-[12px]" style={{ color: '#475569' }}>
          Your credentials stay with Google &mdash; this app never sees your password. You can disconnect anytime in{' '}
          <span style={{ color: '#a78bfa' }}>Settings</span>.
        </p>
      </div>
    );
  },

  // 4: Add to Home Screen
  function HomeScreen() {
    return (
      <div className="px-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#0ea5e922' }}>
            <Smartphone size={22} color="#0ea5e9" />
          </div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>Add to Home Screen</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
          Install the app on your phone for quick access — it works like a native app.
        </p>
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl" style={{ background: '#1a1625' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: '#e2e8f0' }}>iPhone / iPad</div>
            <div className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Open in <strong style={{ color: '#e2e8f0' }}>Safari</strong> → tap the Share icon (square with arrow) → scroll down → <strong style={{ color: '#e2e8f0' }}>&quot;Add to Home Screen&quot;</strong>
            </div>
            <div className="text-[11px] mt-2" style={{ color: '#64748b' }}>
              Must use Safari — Chrome and other browsers don&apos;t support this on iOS.
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#1a1625' }}>
            <div className="text-sm font-semibold mb-2" style={{ color: '#e2e8f0' }}>Android</div>
            <div className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Tap the browser menu (&#8942;) → <strong style={{ color: '#e2e8f0' }}>&quot;Add to Home Screen&quot;</strong> or &quot;Install App&quot;
            </div>
          </div>
        </div>
      </div>
    );
  },

  // 5: Your Data
  function YourData() {
    return (
      <div className="px-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#f59e0b22' }}>
            <AlertTriangle size={22} color="#f59e0b" />
          </div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>Your Data</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-xl" style={{ background: '#1a1625' }}>
            <div className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Where is my data stored?</div>
            <div className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>
              All your shows and settings are stored <strong style={{ color: '#e2e8f0' }}>in your browser</strong> on this device. There are no accounts and no server database.
            </div>
          </div>

          <div className="p-3.5 rounded-xl" style={{ background: '#1a1200', border: '1px solid #92400e' }}>
            <div className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#f59e0b' }}>
              <AlertTriangle size={14} /> Important
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: '#fbbf24' }}>
              <strong>Clearing your browser data or cache will delete your shows.</strong> This includes using &quot;Clear browsing data&quot; in your browser settings.
            </div>
          </div>

          <div className="p-3.5 rounded-xl" style={{ background: '#064e3b22', border: '1px solid #064e3b' }}>
            <div className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#10b981' }}>
              <CalendarCheck2 size={14} /> Google Calendar is your backup
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>
              Once shows are synced to Google Calendar, they&apos;re safe even if browser data is cleared. <strong style={{ color: '#e2e8f0' }}>Sync regularly</strong> to keep your events backed up.
            </div>
          </div>
        </div>
      </div>
    );
  },

  // 6: Privacy
  function Privacy() {
    const items = [
      'Your shows are stored privately — no one else can see them',
      'No shared database — data lives on your device only',
      'Google Calendar connects through your own Google account',
      'The app creator has no access to your data, shows, or calendar',
      'Discovery searches use free APIs — no personal data is shared',
    ];
    return (
      <div className="px-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#10b98122' }}>
            <Shield size={22} color="#10b981" />
          </div>
          <h2 className="text-xl font-bold m-0" style={{ color: '#e2e8f0' }}>Your Data is Private</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {items.map((text, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold"
                   style={{ background: '#10b98122', color: '#10b981' }}>&#10003;</div>
              <div className="text-sm leading-snug" style={{ color: '#e2e8f0' }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const Screen = SCREENS[step];
  const isLast = step === SCREENS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#0a0a0f', color: '#e2e8f0' }}>
      {/* Skip */}
      <div className="px-4 py-3 flex justify-end">
        <button onClick={onComplete} className="bg-transparent border-none cursor-pointer text-[13px] px-2 py-1" style={{ color: '#475569' }}>
          Skip
        </button>
      </div>

      {/* Screen content */}
      <div className="flex-1 flex flex-col pt-2 pb-4 overflow-auto">
        <Screen />
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-8 flex flex-col gap-3">
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mb-1">
          {SCREENS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
                 style={{ width: i === step ? 20 : 8, height: 8, background: i === step ? '#a78bfa' : '#2d2640' }} />
          ))}
        </div>

        {/* Buttons */}
        {isLast ? (
          <button onClick={onComplete}
                  className="w-full py-3.5 rounded-xl text-base font-bold cursor-pointer border-none text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            Got It — Start Using the App
          </button>
        ) : (
          <div className="flex gap-2.5">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                      className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold cursor-pointer"
                      style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#94a3b8' }}>
                Back
              </button>
            )}
            <button onClick={() => setStep(s => s + 1)}
                    className="flex-[2] py-3.5 rounded-xl text-[15px] font-bold cursor-pointer border-none text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              {step === 0 ? 'Get Started' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
