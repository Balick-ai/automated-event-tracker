'use client';

import { useState } from 'react';
import { X, Sparkles, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function AILimitModal({ nextAvailable, onClose, onSaveKey }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const daysLeft = Math.ceil((nextAvailable - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
         style={{ background: 'rgba(0,0,0,0.7)' }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="w-full max-w-[400px] rounded-2xl overflow-hidden"
           style={{ background: '#12101f', border: '1px solid #1e1b30' }}>
        {/* Header */}
        <div className="px-4 py-3.5 flex justify-between items-center" style={{ borderBottom: '1px solid #1e1b30' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={18} color="#a78bfa" />
            <h3 className="m-0 text-base font-bold" style={{ color: '#a78bfa' }}>AI Search Limit</h3>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Limit message */}
          <div className="text-center">
            <div className="text-sm mb-1" style={{ color: '#e2e8f0' }}>
              You&apos;ve used your free AI search this week
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>
              Next free search available in <strong style={{ color: '#a78bfa' }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#2d2640' }} />
            <span className="text-[11px] font-medium" style={{ color: '#64748b' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#2d2640' }} />
          </div>

          {/* Unlock section */}
          <div>
            <div className="text-sm font-semibold mb-1.5" style={{ color: '#e2e8f0' }}>
              Unlock unlimited AI searches
            </div>
            <div className="text-xs mb-3" style={{ color: '#64748b' }}>
              Add your own free Gemini API key. Takes 30 seconds — no credit card required.
            </div>

            {/* Key input */}
            <div className="flex gap-1 items-center mb-2">
              <input type={showKey ? 'text' : 'password'}
                     value={key}
                     onChange={e => setKey(e.target.value)}
                     placeholder="Paste your Gemini API key..."
                     className="flex-1 px-2.5 py-2 rounded-lg text-[13px] outline-none"
                     style={{ background: '#1a1625', border: '1px solid #2d2640', color: '#e2e8f0', boxSizing: 'border-box' }} />
              <button onClick={() => setShowKey(!showKey)}
                      className="bg-transparent border-none cursor-pointer p-1.5" style={{ color: '#64748b' }}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Save button */}
            {key && (
              <button onClick={() => { onSaveKey(key); onClose(); }}
                      className="w-full py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none text-white mb-2"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                Save Key & Search Now
              </button>
            )}

            {/* Instructions link */}
            <a href="https://aistudio.google.com/apikey"
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-1.5 text-xs no-underline py-2"
               style={{ color: '#a78bfa' }}>
              <ExternalLink size={12} />
              Get a free Gemini API key (30 seconds)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
