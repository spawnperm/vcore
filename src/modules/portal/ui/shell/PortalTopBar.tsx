import React from 'react';
import { Monitor, MessageSquare, ExternalLink } from 'lucide-react';

export type ViewMode = 'current' | 'after' | 'diff';

interface PortalTopBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isReviewMode: boolean;
  onToggleReviewMode: () => void;
  onOpenExternal: () => void;
}

export const PortalTopBar: React.FC<PortalTopBarProps> = ({
  viewMode,
  onViewModeChange,
  isReviewMode,
  onToggleReviewMode,
  onOpenExternal,
}) => {
  return (
    <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <span>Вид портала</span>
        </span>

        {/* 3-Mode View Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => onViewModeChange('current')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'current'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>🟢 Сейчас (Прод v2.3)</span>
          </button>

          <button
            onClick={() => onViewModeChange('after')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'after'
                ? 'bg-amber-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>🟡 После изменений (Stage v2.4)</span>
          </button>

          <button
            onClick={() => onViewModeChange('diff')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
              viewMode === 'diff'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-300" />
            <span>⚪ Diff (Наложение)</span>
          </button>
        </div>
      </div>

      {/* Right Tools: UX Review toggle, Fullscreen modal */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleReviewMode}
          className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
            isReviewMode
              ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-sm'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isReviewMode ? 'Режим UX-ревью активен' : '💬 Оставить UX-заметку'}</span>
        </button>

        <button
          onClick={onOpenExternal}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Открыть в новом окне"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
