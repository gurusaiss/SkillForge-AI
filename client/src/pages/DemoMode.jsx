/**
 * DemoMode.jsx — Cinematic Live Agent Orchestration
 * Streams 7 agents activating in real-time via SSE
 * Mission-control aesthetic for judges / demos
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const DEMO_GOALS = [
  { key: 'fullstack',   emoji: '🌐', label: 'Full Stack Developer',   desc: 'React · Node.js · PostgreSQL · Production Apps',  color: '#6366F1' },
  { key: 'datascience', emoji: '🤖', label: 'Data Scientist',          desc: 'ML · Python · Statistical Analysis · Insights',    color: '#10B981' },
  { key: 'doctor',      emoji: '🏥', label: 'Medical Doctor',           desc: 'MBBS · Internal Medicine · Clinical Diagnosis',    color: '#06B6D4' },
  { key: 'lawyer',      emoji: '⚖️', label: 'Corporate Lawyer',         desc: 'Tech Law · IP · Contract Drafting · Litigation',   color: '#F59E0B' },
  { key: 'devops',      emoji: '☸️', label: 'DevOps Engineer',          desc: 'Kubernetes · AWS · CI/CD · Infrastructure',        color: '#8B5CF6' },
];

const AGENTS = [
  { name: 'GoalAgent',       icon: '🎯', color: '#6366F1', desc: 'Parses and profiles your career goal' },
  { name: 'DecomposeAgent',  icon: '🌳', color: '#10B981', desc: 'Builds the skill dependency tree' },
  { name: 'DiagnosticAgent', icon: '📋', color: '#F59E0B', desc: 'Generates calibrated assessment MCQs' },
  { name: 'ScoringAgent',    icon: '📊', color: '#EF4444', desc: 'Maps gaps and scores skill levels' },
  { name: 'CurriculumAgent', icon: '📅', color: '#8B5CF6', desc: 'Builds your personalized learning plan' },
  { name: 'MarketAgent',     icon: '📈', color: '#06B6D4', desc: 'Fetches live market demand & salary data' },
  { name: 'SimulationAgent', icon: '🔮', color: '#F97316', desc: 'Projects your career outcome trajectory' },
];

const STATUS_GLOW = {
  active:   '0 0 20px',
  complete: '0 0 8px',
  waiting:  'none',
};

function AgentStatusPanel({ agentStatus, currentStep, totalSteps }) {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 space-y-4 sticky top-6">
      {/* Pipeline header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">7-Agent Pipeline</p>
          {currentStep > 0 && (
            <span className="text-[10px] font-bold text-indigo-400 font-mono">{pct}%</span>
          )}
        </div>
        {currentStep > 0 && (
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Agent list */}
      <div className="space-y-2">
        {AGENTS.map((agent, i) => {
          const status = agentStatus[agent.name] || 'waiting';
          const isActive = status === 'active';
          const isDone = status === 'complete';

          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500"
              style={{
                background: isActive ? `${agent.color}10` : isDone ? `${agent.color}08` : 'transparent',
                border: `1px solid ${isActive ? agent.color + '40' : isDone ? agent.color + '20' : '#1E293B'}`,
                boxShadow: isActive ? `${STATUS_GLOW.active} ${agent.color}50` : isDone ? `${STATUS_GLOW.complete} ${agent.color}30` : 'none',
              }}
            >
              {/* Icon */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: isDone || isActive ? `${agent.color}20` : '#1E293B' }}>
                {agent.icon}
              </div>

              {/* Name + desc */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate" style={{ color: isDone || isActive ? agent.color : '#64748B' }}>
                    {agent.name}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-ping"
                      style={{ background: agent.color }} />
                  )}
                  {isDone && <span className="text-emerald-400 text-[10px] flex-shrink-0">✓</span>}
                </div>
                <p className="text-[9px] text-slate-600 truncate">{agent.desc}</p>
              </div>

              {/* Step # */}
              <div className="text-[9px] font-mono flex-shrink-0"
                style={{ color: isDone || isActive ? agent.color : '#334155' }}>
                {isDone ? 'done' : isActive ? 'live' : `${i + 1}/7`}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[9px] text-slate-600 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" /> active</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> done</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-700" /> waiting</div>
      </div>
    </div>
  );
}

function StepCard({ step, isLatest, index }) {
  const color = (AGENTS.find(a => a.name === step.agent) || {}).color || '#6B7280';
  const agentInfo = AGENTS.find(a => a.name === step.agent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 items-start"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
          {step.icon || agentInfo?.icon || '🤖'}
        </div>
        <div className="w-px flex-1 mt-1 min-h-[20px]" style={{ background: `${color}20` }} />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        {/* Agent + status row */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-sm font-black" style={{ color }}>{step.agent}</span>
          {step.status === 'active' && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              PROCESSING
            </div>
          )}
          {step.status === 'complete' && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span>✓</span> COMPLETE
            </div>
          )}
          {step.step > 0 && (
            <span className="ml-auto text-[9px] text-slate-600 font-mono">
              step {step.step}/{step.total}
            </span>
          )}
        </div>

        {/* Message */}
        <p className={`text-sm leading-relaxed ${isLatest ? 'text-slate-200' : 'text-slate-400'}`}>
          {step.message}
        </p>

        {/* Data block */}
        {step.data && Object.keys(step.data).length > 0 && (
          <div className="mt-2.5 rounded-xl border border-slate-700/50 bg-slate-900/80 p-3">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Agent Output</p>
            <pre className="font-mono text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(step.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CompletionScreen({ complete, navigate, onRerun }) {
  const metrics = [
    { label: 'Domain',          value: complete.summary?.domain || '—',                                            icon: '🎯' },
    { label: 'Skills Mapped',   value: complete.summary?.skills || '—',                                            icon: '🌳' },
    { label: 'Session Days',    value: complete.summary?.sessions || '—',                                          icon: '📅' },
    { label: 'Market Demand',   value: complete.summary?.marketDemand ? `${complete.summary.marketDemand}/100` : '—', icon: '📈' },
    { label: 'Open Jobs',       value: complete.summary?.opportunityCount ?? '—',                                   icon: '💼' },
    { label: 'Proj. Salary',    value: complete.summary?.projectedSalary ? `$${Math.round(complete.summary.projectedSalary / 1000)}k` : '—', icon: '💰' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Hero */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/25 to-indigo-900/20 p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="text-5xl mb-3"
        >
          ✅
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-1">{complete.message || 'Analysis Complete'}</h2>
        <p className="text-slate-400 text-sm">7 agents orchestrated · Full career intelligence generated</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(({ label, value, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-3 text-center"
          >
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-base font-black text-white font-mono">{value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* What was built */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">What the agents built for you</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            ['Career Goal Profile',  'GoalAgent parsed + profiled your intent',             '🎯'],
            ['Skill Tree',           'DecomposeAgent mapped dependencies',                   '🌳'],
            ['Diagnostic Questions', '5 calibrated MCQs to measure your gaps',               '📋'],
            ['Gap Analysis',         'ScoringAgent identified your weak areas',              '📊'],
            ['Learning Plan',        'CurriculumAgent built your daily roadmap',             '📅'],
            ['Market Intelligence',  'Demand score, salary range, job listings',             '📈'],
            ['Career Simulation',    '6-month projection of your skill trajectory',          '🔮'],
          ].map(([title, detail, icon]) => (
            <div key={title} className="flex gap-2 items-start p-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div>
                <div className="font-bold text-slate-300">{title}</div>
                <div className="text-[10px] text-slate-600 leading-snug mt-0.5">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => navigate('/dashboard')}
          className="py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20">
          📊 Full Dashboard
        </button>
        <button onClick={() => navigate('/career-twin')}
          className="py-3 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all">
          🧬 Career Twin
        </button>
        <button onClick={() => navigate('/simulation')}
          className="py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all">
          🔮 Simulation Lab
        </button>
        <button onClick={() => navigate('/explain')}
          className="py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all">
          🧠 Explainability
        </button>
      </div>

      <button onClick={onRerun}
        className="w-full py-3 rounded-xl font-bold text-sm border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
        ↻ Run Another Analysis
      </button>
    </motion.div>
  );
}

export default function DemoMode() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState('fullstack');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [complete, setComplete] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (steps.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  useEffect(() => () => esRef.current?.close(), []);

  const runDemo = useCallback(() => {
    if (running) return;
    setRunning(true);
    setSteps([]);
    setAgentStatus({});
    setComplete(null);
    setError('');
    setCurrentStep(0);

    const es = new EventSource(`/api/demo/run?goal=${selectedGoal}`);
    esRef.current = es;

    es.addEventListener('start', (e) => {
      const d = JSON.parse(e.data);
      setSteps([{ type: 'system', icon: '🚀', agent: 'Orchestrator', message: d.message, status: 'complete', step: 0, total: 7, data: {} }]);
    });

    es.addEventListener('agent', (e) => {
      const d = JSON.parse(e.data);
      setCurrentStep(d.step || 0);
      setSteps(prev => {
        const idx = prev.findIndex(s => s.agent === d.agent && s.status === 'active');
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = d;
          return updated;
        }
        return [...prev, d];
      });
      setAgentStatus(prev => ({ ...prev, [d.agent]: d.status }));
    });

    es.addEventListener('complete', (e) => {
      const d = JSON.parse(e.data);
      setComplete(d);
      setRunning(false);
      setCurrentStep(7);
      es.close();
      if (d.userId) localStorage.setItem('skillforge:userId', d.userId);
    });

    es.addEventListener('error', (e) => {
      try { setError(JSON.parse(e.data).message); } catch { setError('Demo stream error — please try again.'); }
      setRunning(false);
      es.close();
    });

    es.onerror = () => {
      if (running) { setError('Connection lost. Please try again.'); setRunning(false); es.close(); }
    };
  }, [running, selectedGoal]);

  const reset = () => { setComplete(null); setSteps([]); setAgentStatus({}); setCurrentStep(0); };

  const selectedGoalInfo = DEMO_GOALS.find(g => g.key === selectedGoal);
  const isActive = running || steps.length > 0;

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-emerald-600/6 blur-[80px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-10">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-xs mb-6 transition-all">
            ← Back to Home
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-xs font-bold mb-5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            LIVE AUTONOMOUS AGENT ORCHESTRATION
          </div>

          <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
            Mission{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Control
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Watch 7 specialized agents activate, collaborate, and autonomously build a complete
            personalized career intelligence plan — in real time.
          </p>
        </div>

        {/* ── GOAL SELECTION ─────────────────────────────── */}
        <AnimatePresence>
          {!isActive && !complete && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="mb-8"
            >
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest text-center mb-4">
                Select a career goal to analyze
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {DEMO_GOALS.map(({ key, emoji, label, desc, color }) => (
                  <button key={key} onClick={() => setSelectedGoal(key)}
                    className="flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all"
                    style={{
                      borderColor: selectedGoal === key ? color + '60' : '#1E293B',
                      background: selectedGoal === key ? color + '12' : 'rgba(15,23,42,0.6)',
                      boxShadow: selectedGoal === key ? `0 0 20px ${color}20` : 'none',
                    }}>
                    <div className="text-2xl">{emoji}</div>
                    <div className="font-bold text-xs leading-tight"
                      style={{ color: selectedGoal === key ? color : '#94A3B8' }}>
                      {label}
                    </div>
                    <div className="text-[9px] text-slate-600 leading-snug">{desc}</div>
                    {selectedGoal === key && (
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-black"
                        style={{ borderColor: color, color, background: color + '20' }}>✓</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center mt-6">
                <button onClick={runDemo}
                  className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-2xl font-black text-lg transition-all hover:scale-105 shadow-2xl shadow-indigo-500/30">
                  🚀 Launch Analysis
                </button>
                <p className="text-slate-600 text-[10px] mt-2 font-mono">
                  7 agents · full orchestration · ~15 seconds
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTIVE / COMPLETE: TWO-COLUMN LAYOUT ───────── */}
        {isActive && !complete && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Left: pipeline status */}
            <AgentStatusPanel
              agentStatus={agentStatus}
              currentStep={currentStep}
              totalSteps={7}
            />

            {/* Right: live feed */}
            <div className="space-y-4">
              {/* Feed header */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Agent Execution Log</span>
                </div>
                {running && (
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-amber-400">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" /> LIVE
                  </div>
                )}
                <div className="ml-auto text-[10px] font-mono text-slate-600">
                  {selectedGoalInfo?.emoji} {selectedGoalInfo?.label}
                </div>
              </div>

              {/* Steps */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 space-y-1">
                <AnimatePresence>
                  {steps.map((step, i) => (
                    <StepCard key={`${step.agent}-${i}`} step={step} isLatest={i === steps.length - 1} index={i} />
                  ))}
                </AnimatePresence>
                {running && (
                  <div className="flex items-center gap-2 pl-12 text-slate-600 text-sm animate-pulse py-2">
                    <span className="inline-block animate-spin">⟳</span>
                    <span>Next agent activating…</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLETION ─────────────────────────────────── */}
        {complete && (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Left: final pipeline status */}
            <AgentStatusPanel agentStatus={agentStatus} currentStep={7} totalSteps={7} />
            {/* Right: completion */}
            <CompletionScreen complete={complete} navigate={navigate} onRerun={reset} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-300 text-sm flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold">Demo Error</p>
              <p className="text-xs text-red-400 mt-0.5">{error}</p>
            </div>
            <button onClick={() => { setError(''); reset(); }} className="ml-auto text-xs text-slate-500 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition-all">
              Retry
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
