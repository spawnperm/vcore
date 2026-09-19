import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  CheckCircle2,
  GitCommit,
  Layers,
  ChevronDown,
  ChevronRight,
  Code2,
  Play,
  Sparkles,
  ShieldCheck,
  Radio,
  FileCode,
} from 'lucide-react';
import { DshExecutionResult, DshPortalAction } from '../types';

interface DshResultCardProps {
  result: DshExecutionResult;
  onApplyAction?: (action: DshPortalAction) => void;
  onViewDiff?: (filename: string, diff: string) => void;
}

export const DshResultCard: React.FC<DshResultCardProps> = ({
  result,
  onApplyAction,
  onViewDiff,
}) => {
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);
  const [isDiffExpanded, setIsDiffExpanded] = useState(true);
  const [isTestsExpanded, setIsTestsExpanded] = useState(false);
  const [isApplied, setIsApplied] = useState(result.portalAction?.applied || false);

  const handleApply = () => {
    setIsApplied(true);
    if (onApplyAction) {
      onApplyAction({ ...result.portalAction, applied: true });
    }
  };

  const allTestsPassed = result.tests && result.tests.every((t) => t.status === 'PASSED');

  return (
    <div className="w-full mt-2 rounded-xl border border-cyan-800/80 bg-slate-900/95 overflow-hidden shadow-md text-xs">
      {/* Top Header: DSH + Gemini 3.8 Flash Badges */}
      <div className="p-2.5 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200">deepseek-harness</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
            {result.llm || 'gemini-3.8-flash'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          {result.isVoiceInput && (
            <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1 font-mono">
              <Radio className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
              Live API
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-2.5 h-2.5" />
            DSH verified
          </span>
        </div>
      </div>

      {/* Body: Explanation */}
      <div className="p-3 space-y-2.5">
        <p className="text-slate-200 font-medium leading-relaxed">
          {result.explanation}
        </p>

        {/* Section 1: DSH Plan Pipeline */}
        {result.dshPlan && result.dshPlan.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              onClick={() => setIsPlanExpanded(!isPlanExpanded)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/40 text-[11px] font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Пайплайн DeepSeek-Harness ({result.dshPlan.length} шага)</span>
              </div>
              {isPlanExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isPlanExpanded && (
              <div className="p-2 pt-0 space-y-1 border-t border-slate-800/60 text-[11px]">
                {result.dshPlan.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300 font-mono py-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Code Patch / Diff Preview */}
        {result.patch && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden">
            <button
              onClick={() => setIsDiffExpanded(!isDiffExpanded)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/40 text-[11px] font-semibold"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Code2 className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate font-mono">{result.patch.filename}</span>
              </div>
              {isDiffExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isDiffExpanded && (
              <div className="p-2 border-t border-slate-800/60 bg-slate-950 font-mono text-[10px] overflow-x-auto max-h-40 custom-scrollbar">
                <pre className="text-slate-300 whitespace-pre">
                  {result.patch.diff.split('\n').map((line, lidx) => {
                    const isAdd = line.startsWith('+');
                    const isDel = line.startsWith('-');
                    return (
                      <div
                        key={lidx}
                        className={`${
                          isAdd
                            ? 'text-emerald-300 bg-emerald-950/30'
                            : isDel
                            ? 'text-rose-300 bg-rose-950/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Test Harness Results */}
        {result.tests && result.tests.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              onClick={() => setIsTestsExpanded(!isTestsExpanded)}
              className="w-full px-2.5 py-1.5 flex items-center justify-between text-slate-300 hover:bg-slate-800/40 text-[11px] font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>
                  Тесты DSH Runner ({result.tests.filter((t) => t.status === 'PASSED').length}/
                  {result.tests.length} пройдено)
                </span>
              </div>
              {isTestsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isTestsExpanded && (
              <div className="p-2 border-t border-slate-800/60 space-y-1 text-[10px] font-mono">
                {result.tests.map((test, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5 text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-emerald-400">✓</span>
                      <span className="truncate">{test.name}</span>
                    </div>
                    <span className="text-slate-500">{test.durationMs}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: One-Click Apply to Portal */}
        {result.portalAction && (
          <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
            <div className="text-[11px] text-slate-400 truncate">
              Действие:{' '}
              <span className="text-slate-200 font-medium truncate">
                {result.portalAction.summary}
              </span>
            </div>

            <button
              onClick={handleApply}
              disabled={isApplied}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isApplied
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                  : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white'
              }`}
            >
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Внедрено в Портал</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Применить в Портал</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
