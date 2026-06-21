import React, { useState, useEffect } from 'react';

/**
 * APIKeyBanner — shown on Dashboard when no LLM is configured.
 * Fetches /api/health, dismisses via localStorage.
 */
export default function APIKeyBanner() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('skillforge:bannerDismissed') === 'true'
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setStatus(d?.data))
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem('skillforge:bannerDismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;
  if (!status) return null;

  const geminiOn = status.gemini === 'enabled';
  const groqOn = status.groq?.includes('enabled');

  // Only show banner when both are off
  if (geminiOn || groqOn) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/8 to-orange-500/5 overflow-hidden">
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl flex-shrink-0">
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-amber-300">Running in Rule-Based Mode</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a free API key to unlock AI-generated challenges, evaluations, and reports.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="px-3 py-1.5 text-xs font-bold border border-amber-500/40 text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all"
          >
            {expanded ? 'Hide' : 'Setup Guide'}
          </button>
          <button onClick={dismiss} className="text-slate-600 hover:text-slate-400 transition-all p-1" aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>

      {/* Expanded setup guide */}
      {expanded && (
        <div className="border-t border-amber-500/20 bg-slate-900/60 p-5 space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">How to enable AI features</p>

          {/* Gemini */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs">G</div>
              <p className="text-sm font-black text-blue-300">AI Engine (Gemini / Groq)</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-bold ml-auto">Recommended · Free</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-black flex-shrink-0 mt-0.5">1.</span>
                <span>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">aistudio.google.com/app/apikey</a> and create a free API key</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-black flex-shrink-0 mt-0.5">2.</span>
                <span>In Replit, open the <strong className="text-slate-300">Secrets</strong> panel (🔒 icon in left sidebar)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-black flex-shrink-0 mt-0.5">3.</span>
                <div>
                  Add a new secret:
                  <code className="ml-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-blue-300">GEMINI_API_KEY = your_key_here</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-black flex-shrink-0 mt-0.5">4.</span>
                <span>Restart the <strong className="text-slate-300">Start Backend</strong> workflow to activate</span>
              </div>
            </div>
          </div>

          {/* Groq fallback */}
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-xs">⚡</div>
              <p className="text-sm font-black text-orange-300">Groq (Fallback / Ultra-fast)</p>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold ml-auto">Optional · Free</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">1.</span>
                <span>Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline underline-offset-2 hover:text-orange-300">console.groq.com</a></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-500 font-black flex-shrink-0 mt-0.5">2.</span>
                <div>
                  Add secret:
                  <code className="ml-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-orange-300">GROQ_API_KEY = your_key_here</code>
                </div>
              </div>
            </div>
          </div>

          {/* What you unlock */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">What you unlock with an API key</p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
              {['AI-generated challenges', 'Rubric-based evaluation', 'AI-powered reports', 'Intelligent plan adaptation',
                'AI concept summaries', 'Dynamic skill questions', 'LLM agent debates', 'Real-time market data'].map(f => (
                <div key={f} className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          <button onClick={dismiss} className="w-full py-2.5 rounded-xl text-xs text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700 transition-all">
            Dismiss — continue in rule-based mode
          </button>
        </div>
      )}
    </div>
  );
}
