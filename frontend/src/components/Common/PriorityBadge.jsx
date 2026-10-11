import React, { useState } from 'react';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

const PriorityBadge = ({ score = 25, level = 'MEDIUM', breakdown = [], showExplain = true }) => {
  const [modalOpen, setModalOpen] = useState(false);

  let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
  let badgeIcon = <Info className="w-3 h-3" />;

  if (level === 'CRITICAL' || score >= 81) {
    badgeColor = 'bg-red-950 text-red-200 border-red-700 animate-pulse';
    badgeIcon = <ShieldAlert className="w-3 h-3 text-red-400" />;
  } else if (level === 'HIGH' || score >= 61) {
    badgeColor = 'bg-orange-950 text-orange-200 border-orange-700';
    badgeIcon = <AlertTriangle className="w-3 h-3 text-orange-400" />;
  } else if (level === 'MEDIUM' || score >= 31) {
    badgeColor = 'bg-yellow-950 text-yellow-200 border-yellow-700';
    badgeIcon = <AlertTriangle className="w-3 h-3 text-yellow-400" />;
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
        >
          {badgeIcon}
          <span>{level}</span>
          <span className="opacity-80 font-mono">({score})</span>
        </span>

        {showExplain && breakdown && breakdown.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
            title="View AI-Assisted rule-based scoring rationale"
          >
            Explain
          </button>
        )}
      </div>

      {/* Explainable AI Scoring Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-slate-100 text-base">
                AI-Assisted Intelligent Severity Scoring
              </h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Transparent, explainable rule-based scoring matrix computed in real-time across situational emergency factors.
            </p>

            <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg mb-4 border border-slate-700">
              <div>
                <span className="text-xs text-slate-400">Calculated Priority:</span>
                <div className="text-lg font-bold text-slate-100">{level}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Severity Score:</span>
                <div className="text-2xl font-black text-amber-400">{score} / 100</div>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Scoring Factors Breakdown:
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {breakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-800/60 rounded border border-slate-700/80 text-xs">
                  <div className="flex justify-between font-semibold text-slate-200">
                    <span>{item.factor}</span>
                    <span className="text-emerald-400 font-mono">+{item.points} pts</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">{item.reason}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
              Verified Rule Matrix Engine • Deterministic & Auditable
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PriorityBadge;
