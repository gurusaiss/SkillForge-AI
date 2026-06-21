import React from 'react';
import { useNavigate } from 'react-router-dom';

const PROMPTS = [
  'Tell me about a recent project you led and the tradeoffs you made.',
  'Describe a time you had to debug an issue under pressure.',
  'How do you approach learning a skill you have never used before?',
];

const SCORECARDS = [
  { label: 'Clarity', value: '8.4/10' },
  { label: 'Depth', value: '7.9/10' },
  { label: 'Confidence', value: '8.1/10' },
  { label: 'Hiring Signal', value: 'Strong' },
];

export default function InterviewSimulator() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-slate-400 transition-colors hover:text-white"
        >
          ← Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-8 shadow-2xl shadow-indigo-950/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-2xl">
                🎙
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Interview Simulator</p>
                <h1 className="text-3xl font-bold text-white">Practice with calibrated interview prompts</h1>
              </div>
            </div>

            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              This route now resolves cleanly and provides a focused interview-prep surface for future simulation logic.
              Use the prompts below as a starting point for response drafting and scoring.
            </p>

            <div className="mt-8 space-y-4">
              {PROMPTS.map((prompt, index) => (
                <div
                  key={prompt}
                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Prompt {index + 1}
                  </div>
                  <div className="text-sm text-slate-200">{prompt}</div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-slate-700/70 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {SCORECARDS.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-slate-500">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
              <div className="text-sm font-semibold text-cyan-200">Next step</div>
              <p className="mt-2 text-sm leading-6 text-cyan-50/80">
                Hook this page into the scoring and feedback engine when you are ready to stream answers, evaluate them,
                and surface targeted coaching.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}