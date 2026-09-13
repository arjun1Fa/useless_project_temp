import React from 'react';
import { Flame, ThumbsUp, ThumbsDown, Award, Sparkles, MessageCircle } from 'lucide-react';
import { EvaluationOutput } from '@anti-claude/shared-types';

interface MeltdownFeedProps {
  evaluations: EvaluationOutput[];
  onTriggerEvaluation?: () => void;
  isEvaluating?: boolean;
}

export const MeltdownFeed: React.FC<MeltdownFeedProps> = ({
  evaluations,
  onTriggerEvaluation,
  isEvaluating = false,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#161822] border border-[#26293a] rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 bg-[#11131a] border-b border-[#26293a]">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">
            Student Meltdown & Roast Feed
          </span>
        </div>
        {onTriggerEvaluation && (
          <button
            onClick={onTriggerEvaluation}
            disabled={isEvaluating}
            className="px-2.5 py-1 text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-md transition shadow-md flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isEvaluating ? 'EVALUATING...' : 'FORCE GRADE'}
          </button>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {evaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center font-mono">
            <MessageCircle className="w-8 h-8 text-slate-400 mb-2" />
            No submissions graded yet.<br />
            Waiting for human to save or ruin Anti-Claude's semester.
          </div>
        ) : (
          evaluations.map((evalItem, index) => (
            <div
              key={index}
              className={`p-3.5 rounded-xl border transition-all ${
                evalItem.passed
                  ? 'bg-emerald-950/20 border-emerald-800/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-rose-950/25 border-rose-800/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              }`}
            >
              {/* Header: Grade & Frustration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono text-sm ${
                      evalItem.grade === 'S' || evalItem.grade === 'A'
                        ? 'bg-emerald-600 text-white'
                        : evalItem.grade === 'B' || evalItem.grade === 'C'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white animate-pulse'
                    }`}
                  >
                    {evalItem.grade}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      {evalItem.passed ? 'PASSED / BRO SAVED' : 'FAILED / COOKED'}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400">
                      Rizz Score: {evalItem.critique.rizzOrConvincingScore}/100
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`text-xs font-bold ${evalItem.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {evalItem.scoreDelta >= 0 ? `+${evalItem.scoreDelta}` : evalItem.scoreDelta} Bro Pts
                  </div>
                  <div className="text-[10px] text-slate-400">
                    GPA {evalItem.gpaDelta >= 0 ? `+${evalItem.gpaDelta.toFixed(1)}` : evalItem.gpaDelta.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Frustration Bar */}
              <div className="mt-2.5 flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px]">FRUSTRATION:</span>
                <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      evalItem.frustrationLevel > 70 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${evalItem.frustrationLevel}%` }}
                  ></div>
                </div>
                <span className={`text-[10px] font-bold ${evalItem.frustrationLevel > 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {evalItem.frustrationLevel}%
                </span>
              </div>

              {/* Feedback Quote */}
              <div className="mt-2 p-2.5 bg-[#0c0d12]/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed italic">
                "{evalItem.feedbackMessage}"
              </div>

              {/* Facts Extracted */}
              {evalItem.discoveredFacts && evalItem.discoveredFacts.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                  <span>🧠 New Lore:</span>
                  <span className="truncate">{evalItem.discoveredFacts[0]}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
