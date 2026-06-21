import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TIERS = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    badge: null,
    color: '#64748B',
    description: 'Try the full agentic experience — no credit card required.',
    cta: 'Get Started Free',
    ctaStyle: 'border border-slate-600 text-slate-300 hover:bg-slate-800',
    features: [
      { text: '1 active learning goal', included: true },
      { text: 'Full 7-agent pipeline', included: true },
      { text: 'Diagnostic assessment', included: true },
      { text: 'Up to 7-day learning plan', included: true },
      { text: 'Live Demo Mode', included: true },
      { text: 'Basic explainability log', included: true },
      { text: 'Simulation Lab (3 queries/mo)', included: true },
      { text: 'Career Digital Twin', included: false },
      { text: 'Unlimited learning paths', included: false },
      { text: 'AI-powered report (Gemini)', included: false },
      { text: 'Agent Debate Engine', included: false },
      { text: 'Market Intelligence feed', included: false },
    ],
  },
  {
    name: 'Pro',
    price: { monthly: 19, annual: 15 },
    badge: 'Most Popular',
    color: '#6366F1',
    description: 'Full autonomous career intelligence. Unlimited paths, real AI.',
    cta: 'Start Pro Trial',
    ctaStyle: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/25',
    features: [
      { text: 'Unlimited learning goals', included: true },
      { text: 'Full 7-agent pipeline', included: true },
      { text: 'Adaptive diagnostic engine', included: true },
      { text: 'Unlimited learning plan days', included: true },
      { text: 'Live Demo Mode', included: true },
      { text: 'Full explainability console', included: true },
      { text: 'Unlimited Simulation Lab', included: true },
      { text: 'Career Digital Twin', included: true },
      { text: 'AI-powered reports (Gemini 2.0)', included: true },
      { text: 'Agent Debate Engine', included: true },
      { text: 'Market Intelligence feed', included: true },
      { text: 'Confidence Heatmap + Analytics', included: true },
    ],
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    badge: 'Custom',
    color: '#10B981',
    description: 'Team dashboards, SSO, custom agents, white-label, SLA.',
    cta: 'Contact Sales',
    ctaStyle: 'border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Team / org dashboards', included: true },
      { text: 'SSO / SAML authentication', included: true },
      { text: 'Custom agent configuration', included: true },
      { text: 'White-label branding', included: true },
      { text: 'Advanced analytics & exports', included: true },
      { text: 'Dedicated success manager', included: true },
      { text: 'Priority support SLA', included: true },
      { text: 'On-premise deployment option', included: true },
      { text: 'Custom LLM integration', included: true },
      { text: 'API access for integrations', included: true },
      { text: 'Compliance (SOC 2, GDPR)', included: true },
    ],
  },
];

const FAQS = [
  {
    q: 'How is SkillForge different from just using ChatGPT?',
    a: 'ChatGPT is a general-purpose assistant. SkillForge is a specialized multi-agent system with persistent career memory, autonomous plan adaptation, multi-step orchestration across 7 specialized agents, longitudinal tracking, and explainable decisions. It doesn\'t just answer questions — it autonomously builds and executes your career development strategy.',
  },
  {
    q: 'Do I need an API key to use SkillForge?',
    a: 'The Starter plan works without an API key using our rule-based engine. Pro and Enterprise plans use Gemini 2.0 Flash for AI-powered challenges, evaluations, and reports. You can bring your own key or use ours.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Pro is billed monthly or annually and can be cancelled at any time. No long-term commitment required.',
  },
  {
    q: 'What skills and domains does SkillForge support?',
    a: 'SkillForge supports any domain — software engineering, data science, design, medicine, law, finance, and more. Our agents use LLMs to handle domains outside the pre-built rule base.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your learning data, assessments, and career profile are stored securely and never shared with third parties. Enterprise plans include on-premise options for maximum data sovereignty.',
  },
];

const METRICS = [
  { value: '94%', label: 'Goal completion rate', icon: '🎯' },
  { value: '3.2×', label: 'Faster skill acquisition', icon: '⚡' },
  { value: '$18k', label: 'Average salary increase', icon: '💰' },
  { value: '7', label: 'Specialized AI agents', icon: '🤖' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-indigo-600/8 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-24">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-xs font-semibold text-indigo-300 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            SaaS Pricing — Simple & Transparent
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight">
            Invest in your{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Career Intelligence
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            The only autonomous multi-agent career platform that learns from you, adapts to you, and builds your future — without waiting for human instruction.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${!annual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(a => !a)}
              className={`relative w-12 h-6 rounded-full transition-all ${annual ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-white' : 'text-slate-500'}`}>
              Annual <span className="text-emerald-400 text-xs font-bold ml-1">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                tier.badge === 'Most Popular'
                  ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10'
                  : 'border-slate-700/60 bg-slate-900/40'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                  style={{ background: tier.color, color: '#fff' }}>
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <h3 className="text-lg font-black text-white mb-1">{tier.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {tier.price.monthly === null ? (
                  <div className="text-3xl font-black" style={{ color: tier.color }}>Custom</div>
                ) : tier.price.monthly === 0 ? (
                  <div className="text-4xl font-black text-white">Free</div>
                ) : (
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black text-white">${annual ? tier.price.annual : tier.price.monthly}</span>
                    <span className="text-slate-500 text-sm mb-1">/month</span>
                    {annual && <span className="text-emerald-400 text-xs font-bold mb-1 ml-2">billed annually</span>}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => navigate(tier.name === 'Starter' ? '/' : '/')}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-6 ${tier.ctaStyle}`}
              >
                {tier.cta}
              </button>

              {/* Features */}
              <div className="space-y-2.5 flex-1">
                {tier.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2.5 text-xs">
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                      f.included ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                    }`}>
                      {f.included ? '✓' : '✕'}
                    </span>
                    <span className={f.included ? 'text-slate-300' : 'text-slate-600'}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {METRICS.map(({ value, label, icon }) => (
            <div key={label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black text-indigo-400 font-mono">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* vs ChatGPT Comparison */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">Why not just use ChatGPT?</h2>
            <p className="text-slate-400 text-sm">A fair question. Here's an honest comparison.</p>
          </div>
          <div className="overflow-x-auto rounded-2xl">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/40 overflow-hidden min-w-[520px]">
            <div className="grid grid-cols-3 text-center text-xs font-black uppercase tracking-wider border-b border-slate-700/50">
              <div className="p-4 text-slate-500">Capability</div>
              <div className="p-4 text-slate-400 bg-slate-800/40">ChatGPT / Claude</div>
              <div className="p-4 text-indigo-300 bg-indigo-500/5">SkillForge AI</div>
            </div>
            {[
              ['Architecture', 'Single model, stateless', '7 specialized agents, orchestrated'],
              ['Memory', 'Session only (resets)', 'Persistent career memory across time'],
              ['Personalization', 'Prompt-based, manual', 'Autonomous learner profiling'],
              ['Plan adaptation', 'Manual re-prompting', 'Auto-adapts after every session'],
              ['Skill assessment', 'Conversational estimate', 'Calibrated diagnostic engine'],
              ['Explainability', 'Black box reasoning', 'Full decision log + reasoning chain'],
              ['Market intelligence', 'General knowledge (stale)', 'Live domain + salary data'],
              ['Career simulation', 'Hypothetical answers', 'What-if engine with projections'],
              ['Goal tracking', 'None — starts fresh', 'Longitudinal progress + competency proof'],
            ].map(([cap, gpt, sf], i) => (
              <div key={cap} className={`grid grid-cols-3 text-xs border-b border-slate-800/60 ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                <div className="p-4 text-slate-400 font-semibold">{cap}</div>
                <div className="p-4 text-slate-500 bg-slate-800/30 text-center">{gpt}</div>
                <div className="p-4 text-emerald-300 bg-indigo-500/3 text-center font-semibold">{sf}</div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3 max-w-3xl mx-auto">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-sm font-semibold text-slate-200">{faq.q}</span>
                  <span className={`text-slate-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/15 to-purple-600/10 p-10 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl font-black mb-3">Ready to forge your career?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">Start free. 7 agents. Fully autonomous. No human instruction required.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm transition-all shadow-xl shadow-indigo-500/25"
            >
              Start Free →
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="px-8 py-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 rounded-xl font-bold text-sm transition-all"
            >
              🚀 Watch Live Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
