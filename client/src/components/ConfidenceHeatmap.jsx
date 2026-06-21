import React, { useMemo } from 'react';

/**
 * ConfidenceHeatmap — shows predicted vs actual score calibration per session
 * Uses calibration data stored in localStorage (skillforge:calibrations)
 */
export default function ConfidenceHeatmap({ sessions }) {
  const calibrations = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('skillforge:calibrations') || '[]');
    } catch { return []; }
  }, []);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-600 text-xs gap-2">
        <span className="text-3xl opacity-40">🎯</span>
        Complete sessions with confidence ratings to see calibration heatmap
      </div>
    );
  }

  // Build calibration matrix: row = predicted bucket, col = actual bucket
  // Buckets: 0-20, 21-40, 41-60, 61-80, 81-100
  const BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  const BUCKET_MID = [10, 30, 50, 70, 90];

  const getBucket = (score) => {
    if (score <= 20) return 0;
    if (score <= 40) return 1;
    if (score <= 60) return 2;
    if (score <= 80) return 3;
    return 4;
  };

  const matrix = Array.from({ length: 5 }, () => Array(5).fill(0));
  let totalEntries = 0;

  calibrations.forEach(({ predicted, actual }) => {
    if (typeof predicted === 'number' && typeof actual === 'number') {
      matrix[getBucket(predicted)][getBucket(actual)]++;
      totalEntries++;
    }
  });

  // Also use session data when no explicit calibration: use score for both axes as "perfect prediction"
  const sessionMapped = sessions.map((s, i) => {
    const cal = calibrations[i];
    return {
      day: s.day,
      actual: s.score,
      predicted: cal ? cal.predicted : null,
      diff: cal ? Math.abs(cal.actual - cal.predicted) : null,
    };
  });

  const calibratedSessions = sessionMapped.filter(s => s.predicted !== null);
  const avgError = calibratedSessions.length
    ? Math.round(calibratedSessions.reduce((sum, s) => sum + s.diff, 0) / calibratedSessions.length)
    : null;

  const overconfident = calibratedSessions.filter(s => s.predicted > s.actual + 15).length;
  const underconfident = calibratedSessions.filter(s => s.predicted < s.actual - 15).length;
  const wellCalibrated = calibratedSessions.length - overconfident - underconfident;

  const maxCell = Math.max(1, ...matrix.flat());

  const cellColor = (count) => {
    if (count === 0) return 'rgba(30,41,59,0.5)';
    const intensity = count / maxCell;
    if (intensity > 0.7) return `rgba(99,102,241,${0.5 + intensity * 0.4})`;
    if (intensity > 0.4) return `rgba(99,102,241,${0.25 + intensity * 0.3})`;
    return `rgba(99,102,241,${0.1 + intensity * 0.2})`;
  };

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Well Calibrated',
            value: calibratedSessions.length > 0 ? `${Math.round((wellCalibrated / calibratedSessions.length) * 100)}%` : '—',
            color: '#10B981',
            icon: '🎯',
            desc: 'Predictions within ±15pts',
          },
          {
            label: 'Avg Prediction Error',
            value: avgError !== null ? `${avgError}pts` : '—',
            color: avgError !== null && avgError <= 15 ? '#10B981' : '#F59E0B',
            icon: '📊',
            desc: 'Lower = better calibration',
          },
          {
            label: 'Overconfident',
            value: calibratedSessions.length > 0 ? overconfident : '—',
            color: '#EF4444',
            icon: '⚠️',
            desc: 'Predicted much higher than actual',
          },
        ].map(({ label, value, color, icon, desc }) => (
          <div key={label} className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3 text-center">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-xl font-black font-mono" style={{ color }}>{value}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{label}</div>
            <div className="text-[9px] text-slate-600 mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      {/* Session-by-session calibration bars */}
      {calibratedSessions.length > 0 ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-4">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Session Calibration Timeline</p>
          <div className="space-y-2">
            {sessionMapped.map((s, i) => {
              if (!s.predicted) {
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 font-mono w-10 flex-shrink-0">D{s.day}</span>
                    <div className="flex-1 h-6 bg-slate-800/60 rounded-lg flex items-center px-3">
                      <span className="text-slate-600 text-[9px]">No confidence rating</span>
                    </div>
                    <span className="text-slate-500 w-10 text-right font-mono">{s.actual}%</span>
                  </div>
                );
              }
              const maxVal = Math.max(s.predicted, s.actual, 100);
              const isOver = s.predicted > s.actual + 15;
              const isUnder = s.predicted < s.actual - 15;
              const calibClass = isOver ? 'text-red-400' : isUnder ? 'text-amber-400' : 'text-emerald-400';
              const calibLabel = isOver ? 'overconfident' : isUnder ? 'underestimated' : 'well calibrated';

              return (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-mono w-10 flex-shrink-0">D{s.day}</span>
                  <div className="flex-1 relative h-6 bg-slate-800 rounded-lg overflow-hidden">
                    {/* Actual */}
                    <div
                      className="absolute left-0 top-1 bottom-1 rounded-md bg-indigo-500/60 transition-all"
                      style={{ width: `${(s.actual / maxVal) * 100}%` }}
                    />
                    {/* Predicted */}
                    <div
                      className="absolute left-0 top-0 bottom-0 border-r-2 border-dashed"
                      style={{
                        width: `${(s.predicted / maxVal) * 100}%`,
                        borderColor: isOver ? '#EF4444' : isUnder ? '#F59E0B' : '#10B981',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-2 gap-2">
                      <span className="text-[9px] font-bold text-white/70">Actual: {s.actual}%</span>
                      <span className="text-[9px] font-bold" style={{ color: isOver ? '#EF4444' : isUnder ? '#F59E0B' : '#10B981' }}>
                        Pred: {s.predicted}%
                      </span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-semibold w-24 text-right flex-shrink-0 ${calibClass}`}>{calibLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[9px] text-slate-600">
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 rounded bg-indigo-500/60" /> Actual score</div>
            <div className="flex items-center gap-1"><div className="w-3 h-0 border-t-2 border-dashed border-emerald-400" /> Predicted (calibrated)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-0 border-t-2 border-dashed border-red-400" /> Predicted (overconfident)</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/20 p-6 text-center text-xs text-slate-500">
          <div className="text-2xl mb-2">🎯</div>
          Rate your confidence at the start of each session to unlock the calibration timeline.
          <br /><span className="text-[9px] text-slate-700 mt-1 block">Confidence calibration tracks whether you accurately predict your own performance.</span>
        </div>
      )}

      {/* Calibration tip */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">What is Confidence Calibration?</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Before each session, you predict your confidence (1–5 stars). After scoring, we compare your prediction to your actual result.
          Being well-calibrated means your self-assessment accurately reflects your real knowledge — a critical metacognitive skill for self-directed learners.
        </p>
      </div>
    </div>
  );
}
