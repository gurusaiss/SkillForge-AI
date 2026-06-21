import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import AgentThinking from '../components/AgentThinking.jsx';
import { ConfidenceSelector, ConfidenceResult } from '../components/ConfidenceCalibration.jsx';

function CountUp({ target, duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{current}</>;
}

const GRADE_META = {
  A: { label: 'Outstanding', color: '#10B981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', emoji: '🏆' },
  B: { label: 'Proficient',  color: '#6366F1', bg: 'bg-indigo-500/15',  border: 'border-indigo-500/30',  emoji: '⭐' },
  C: { label: 'Developing',  color: '#F59E0B', bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   emoji: '📈' },
  D: { label: 'Needs Work',  color: '#F97316', bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  emoji: '💪' },
  F: { label: 'Keep Going',  color: '#EF4444', bg: 'bg-red-500/15',     border: 'border-red-500/30',     emoji: '🔄' },
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = {
  correct:   'border-emerald-500 bg-emerald-500/20 text-emerald-100',
  wrong:     'border-red-500 bg-red-500/20 text-red-200',
  selected:  'border-indigo-500 bg-indigo-500/20 text-white',
  default:   'border-slate-700 bg-slate-800/30 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70',
};

const ASSESSMENT_TYPE_LABELS = {
  multiple_choice: 'MCQ',
  fill_in_blank: 'Blank',
  subjective: 'Subjective',
};

function getOptionText(opt) {
  return String(opt || '').replace(/^[A-D]\)\s*/, '').trim();
}

function isQuestionComplete(question, answer) {
  if (!question) return false;
  if (question.type === 'multiple_choice') return Boolean(answer);
  if (question.type === 'fill_in_blank') return String(answer || '').trim().length > 0;
  if (question.type === 'subjective') return String(answer || '').trim().split(/\s+/).filter(Boolean).length >= 8;
  return Boolean(answer);
}

function LearnPhase({ challenge, planDay, onReady }) {
  const cs = challenge?.conceptSummary;
  const topic = planDay?.topic || planDay?.skillName || 'Today\'s Concept';

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 sm:py-10 space-y-5">
      <div className="text-center mb-2">
        <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.22em] mb-1">
          📚 Learn First — Then Practice
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1 leading-tight">
          {cs?.title || topic}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Read through this before your assessment — it will make the difference.</p>
      </div>

      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-5">
        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span>📖</span> Definition
        </p>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
          {cs?.definition || `${topic} is a key concept you'll practice in today's session.`}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <span>🔑</span> Key Points
        </p>
        <ul className="space-y-2.5">
          {(cs?.keyPoints || [
            `${topic} is fundamental to mastering ${planDay?.skillName}`,
            'Focus on understanding the concept before applying it',
            'Practice with real-world scenarios to solidify your knowledge',
          ]).map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-slate-300">
              <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 border border-indigo-500/30">
                {i + 1}
              </span>
              <span className="leading-relaxed">{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {(cs?.example) && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>💡</span> Real-World Example
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{cs.example}</p>
        </div>
      )}

      {(cs?.proTip) && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
          <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <span>⚡</span> Pro Tip
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{cs.proTip}</p>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-600 justify-center flex-wrap">
        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
          {planDay?.skillName}
        </span>
        <span>•</span>
        <span className="capitalize">{planDay?.sessionType} session</span>
        <span>•</span>
        <span>~{planDay?.estimatedMinutes}m total</span>
      </div>

      <button
        onClick={onReady}
        className="w-full py-4 rounded-xl font-black text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.99]"
      >
        ✅ I'm Ready — Start Assessment →
      </button>
    </div>
  );
}

function ReflectionJournal({ skillName, score, grade, onComplete }) {
  const [reflection, setReflection] = useState('');
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const entry = { date: new Date().toISOString(), skillName, score, grade, reflection, keyTakeaway };
    const existing = JSON.parse(localStorage.getItem('skillforge:journal') || '[]');
    localStorage.setItem('skillforge:journal', JSON.stringify([...existing, entry].slice(-50)));
    setSubmitted(true);
    setTimeout(onComplete, 1200);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <div className="text-3xl mb-2">📓</div>
        <p className="text-sm font-black text-emerald-400">Reflection saved!</p>
        <p className="text-xs text-slate-500 mt-1">Added to your learning journal.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">📓</span>
        <div>
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide">Reflection Journal</h3>
          <p className="text-xs text-slate-500">2 minutes to consolidate what you learned</p>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">What did you learn? What was challenging?</label>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          className="w-full min-h-[90px] rounded-xl border border-slate-700 bg-[#060B14] p-3 text-slate-200 text-sm focus:border-purple-500 focus:outline-none resize-none"
          placeholder="e.g. I understood seam allowance better today, but bias cut is still confusing..."
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">One key takeaway:</label>
        <input
          type="text"
          value={keyTakeaway}
          onChange={e => setKeyTakeaway(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-[#060B14] px-3 py-2.5 text-slate-200 text-sm focus:border-purple-500 focus:outline-none"
          placeholder="e.g. Always press seams open after sewing..."
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSubmit}
          disabled={!reflection.trim() || !keyTakeaway.trim()}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Reflection
        </button>
        <button onClick={onComplete} className="px-4 py-2.5 rounded-xl text-sm text-slate-600 border border-slate-800 hover:text-slate-400 transition-all">
          Skip
        </button>
      </div>
    </div>
  );
}

function AssessmentQuiz({ sessionDay, planDay, challenge, answers, setAnswers, quizIndex, setQuizIndex, onSubmit, isSubmitting, error }) {
  const questions = challenge?.assessment?.questions || [];
  const question = questions[quizIndex];
  const answer = answers[question?.id];
  const type = question?.type;
  const isMCQ = type === 'multiple_choice';
  const isBlank = type === 'fill_in_blank';
  const isSubjective = type === 'subjective';
  const wordCount = useMemo(() => String(answer || '').trim() ? String(answer).trim().split(/\s+/).length : 0, [answer]);
  const complete = isQuestionComplete(question, answer);
  const progress = questions.length ? Math.round(((quizIndex + 1) / questions.length) * 100) : 0;

  const updateAnswer = (value) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  };

  const goNext = () => {
    if (complete && quizIndex < questions.length - 1) setQuizIndex(quizIndex + 1);
  };

  const goPrev = () => {
    if (quizIndex > 0) setQuizIndex(quizIndex - 1);
  };

  if (!question) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/80 p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Session {sessionDay} Assessment</p>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-0.5 leading-tight">{planDay.topic || planDay.skillName}</h2>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-500 bg-slate-800/70 border border-slate-700 rounded-full px-3 py-1 w-fit">
          7 MCQ · 2 Blanks · 1 Subjective
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
          Question {quizIndex + 1} of {questions.length}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
          {ASSESSMENT_TYPE_LABELS[type] || type}
        </span>
        {isSubjective && (
          <span className={`px-2.5 py-1 rounded-full border font-semibold ${wordCount >= 30 ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'}`}>
            {wordCount} words
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 font-black">
            {quizIndex + 1}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
              {ASSESSMENT_TYPE_LABELS[type] || type} Question
            </p>
            <h3 className="text-base sm:text-lg font-black text-slate-100 leading-snug">{question.question}</h3>
          </div>
        </div>
      </div>

      {isMCQ && (
        <div className="grid gap-2">
          {(question.options || []).map((opt, idx) => {
            const label = OPTION_LABELS[idx];
            const selected = answer === opt;
            return (
              <button
                key={opt}
                onClick={() => updateAnswer(opt)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  selected ? OPTION_COLORS.selected : OPTION_COLORS.default
                }`}
              >
                <span className="w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center text-sm font-black border border-slate-600 bg-slate-800 text-slate-300">
                  {label}
                </span>
                <span className="text-sm sm:text-base leading-relaxed">{getOptionText(opt)}</span>
              </button>
            );
          })}
        </div>
      )}

      {isBlank && (
        <input
          value={answer || ''}
          onChange={e => updateAnswer(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-slate-100 text-base focus:border-indigo-500 focus:outline-none"
          placeholder="Type the missing term or short phrase"
          autoComplete="off"
        />
      )}

      {isSubjective && (
        <textarea
          value={answer || ''}
          onChange={e => updateAnswer(e.target.value)}
          className="w-full min-h-[220px] rounded-xl border border-slate-700 bg-[#060B14] p-4 text-slate-100 text-base focus:border-indigo-500 focus:outline-none resize-y"
          placeholder="Write your answer here. Include reasoning, steps, a practical example, and one mistake to avoid."
        />
      )}

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={goPrev}
          disabled={quizIndex === 0 || isSubmitting}
          className="px-5 py-3 rounded-xl font-black text-sm border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={quizIndex === questions.length - 1 ? onSubmit : goNext}
          disabled={!complete || isSubmitting}
          className="flex-1 px-5 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting…' : quizIndex === questions.length - 1 ? 'Submit Assessment →' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
}

export default function Session() {
  const { day } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('skillforge:userId');

  const [data, setData] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [historicalCalibrations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('skillforge:calibrations') || '[]'); } catch { return []; }
  });

  const assessmentQuestions = data?.challenge?.assessment?.questions || [];
  const allAssessmentQuestionsComplete = assessmentQuestions.every(q => isQuestionComplete(q, answers[q.id]));

  useEffect(() => {
    let cancelled = false;
    if (!userId) { navigate('/'); return; }
    api.getChallenge(userId, day)
      .then(payload => {
        if (!cancelled) { setData(payload); setPhase('confidence'); }
      })
      .catch(e => { if (!cancelled) { setError(e.message); setPhase('error'); } });
    return () => { cancelled = true; };
  }, [day, userId, navigate]);

  const handleSubmitAssessment = async () => {
    const missing = assessmentQuestions.find(q => !isQuestionComplete(q, answers[q.id]));
    if (missing) {
      setError(`Please answer question ${assessmentQuestions.indexOf(missing) + 1} before submitting.`);
      return;
    }

    setSubmittingAssessment(true);
    setPhase('evaluating');
    try {
      const payload = await api.submitAssessment({
        userId,
        day: Number(day),
        skillId: data.planDay.skillId,
        challenge: data.challenge,
        answers,
      });
      setResult(payload);
      if (confidenceLevel) {
        const predicted = confidenceLevel * 20;
        const cals = [...historicalCalibrations, { predicted, actual: payload.evaluation.score, day: Number(day) }];
        localStorage.setItem('skillforge:calibrations', JSON.stringify(cals.slice(-20)));
      }
      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('assessment');
    } finally {
      setSubmittingAssessment(false);
    }
  };

  if (phase === 'loading') return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <AgentThinking isVisible messages={["Loading today's mission…", "Generating your 10-question assessment…", "Calibrating difficulty…"]} />
    </div>
  );

  if (phase === 'error') return (
    <div className="mx-auto max-w-3xl px-6 py-14 text-red-400 text-center text-sm">{error || 'Challenge not found.'}</div>
  );

  const afterConfidence = () => {
    setPhase('learn');
  };
  const afterLearn = () => {
    setPhase('assessment');
  };

  if (phase === 'confidence') return (
    <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-10 space-y-5">
      <div className="text-center mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Session {day}</p>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">Before You Begin</h1>
        <p className="text-sm text-slate-500 mt-1">The agent tracks your metacognitive accuracy before the 10-question session.</p>
      </div>
      <ConfidenceSelector onSelect={(level) => { setConfidenceLevel(level); setTimeout(afterConfidence, 400); }} selected={confidenceLevel} />
      <button
        onClick={afterConfidence}
        className="w-full py-3 rounded-xl text-xs sm:text-sm text-slate-600 border border-slate-800 hover:text-slate-400 hover:border-slate-700 transition-all"
      >
        Skip confidence check →
      </button>
    </div>
  );

  if (phase === 'learn' && data) return (
    <LearnPhase
      challenge={data.challenge}
      planDay={data.planDay}
      onReady={afterLearn}
    />
  );

  if (phase === 'assessment' && data) {
    return (
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Session {day}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">{data.planDay.skillName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Today's topic: <span className="text-indigo-300 font-bold">{data.planDay.topic}</span>
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-600 hover:text-slate-400 transition-colors">
            ← Dashboard
          </button>
        </div>

        <AssessmentQuiz
          sessionDay={day}
          planDay={data.planDay}
          challenge={data.challenge}
          answers={answers}
          setAnswers={setAnswers}
          quizIndex={quizIndex}
          setQuizIndex={setQuizIndex}
          onSubmit={handleSubmitAssessment}
          isSubmitting={submittingAssessment}
          error={error}
        />

        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
          <button onClick={() => setShowHints(h => !h)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold">
            <span>💡 Session Hints ({data.challenge.hints?.length || 0})</span>
            <span>{showHints ? '▲' : '▼'}</span>
          </button>
          {showHints && (
            <div className="px-4 pb-4 space-y-2">
              {(data.challenge.hints || []).map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-indigo-500 font-bold mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'evaluating') return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <AgentThinking isVisible messages={['Evaluating your assessment…', 'Checking MCQ answers…', 'Reviewing blanks and subjective reasoning…', 'Calibrating score…', 'Almost done…']} />
    </div>
  );

  if (phase === 'journal' && result) {
    const { evaluation } = result;
    return (
      <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-8 space-y-5">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Session {day} Complete</p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">Lock In Your Learning</h1>
        </div>
        <ReflectionJournal
          skillName={data?.planDay?.skillName || ''}
          score={evaluation.score}
          grade={evaluation.grade}
          onComplete={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  if (phase === 'result' && result) {
    const { evaluation, adaptations: newAdaptations } = result;
    const gradeMeta = GRADE_META[evaluation.grade] || GRADE_META.F;
    const isAIEval = evaluation.source === 'llm';

    return (
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-8 space-y-5">
        <div className={`rounded-2xl border p-6 text-center ${gradeMeta.bg} ${gradeMeta.border}`}>
          <div className="text-5xl mb-2">{gradeMeta.emoji}</div>
          <div className="text-7xl sm:text-8xl font-black font-mono mb-1" style={{ color: gradeMeta.color }}>
            <CountUp target={evaluation.score} />
          </div>
          <div className="text-sm sm:text-base font-black uppercase tracking-widest" style={{ color: gradeMeta.color }}>
            Grade {evaluation.grade} — {gradeMeta.label}
          </div>
          {isAIEval && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30 font-semibold">
              🤖 AI Evaluated
            </span>
          )}
          <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-lg mx-auto leading-relaxed">{evaluation.feedback}</p>
        </div>

        {evaluation.coachNote && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/8 p-4 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">🤖</span>
            <div>
              <p className="text-xs font-black text-violet-400 uppercase tracking-widest mb-1">AI Coach Note</p>
              <p className="text-sm text-slate-300 leading-relaxed">{evaluation.coachNote}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="text-sm font-black text-emerald-400 mb-3 uppercase tracking-wide">✅ Strengths</h3>
            <ul className="space-y-2">
              {(evaluation.strengths || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <h3 className="text-sm font-black text-red-400 mb-3 uppercase tracking-wide">📈 To Improve</h3>
            <ul className="space-y-2">
              {(evaluation.weaknesses || []).map((item, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {confidenceLevel && (
          <ConfidenceResult
            confidenceLevel={confidenceLevel}
            actualScore={evaluation.score}
            historicalCalibrations={historicalCalibrations}
          />
        )}

        <div className="rounded-xl border border-slate-700 bg-slate-900/60">
          <button onClick={() => setShowSolution(s => !s)} className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-300 font-semibold">
            <span>💡 View Model Solution</span>
            <span>{showSolution ? '▲' : '▼'}</span>
          </button>
          {showSolution && (
            <div className="px-4 pb-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.modelSolution}</p>
            </div>
          )}
        </div>

        {newAdaptations?.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Agent Updated Your Plan</p>
            </div>
            <p className="text-sm text-amber-200/80 leading-relaxed">{newAdaptations[newAdaptations.length - 1]}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setPhase('journal')}
            className="flex-1 py-3.5 rounded-xl font-black text-sm border border-purple-700/50 bg-purple-900/20 text-purple-300 hover:text-purple-200 hover:border-purple-600 transition-all"
          >
            📓 Reflect & Journal
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3.5 rounded-xl font-black text-sm border border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          >
            ← Dashboard
          </button>
          {result.nextDay && (
            <button
              onClick={() => navigate(`/session/${result.nextDay}`)}
              className="flex-1 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all"
            >
              Next Session (Day {result.nextDay}) →
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
