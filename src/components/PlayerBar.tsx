import React from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  RotateCcw,
  Package,
  GitBranch,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface PlayerBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  progress: number;
  currentAction: string;
  activeBranch: string;
  agentsCount: number;
  onOpenCommitModal: () => void;
  onOpenBranchModal: () => void;
  onOpenAgentsModal: () => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  onStepForward,
  onStepBackward,
  progress,
  currentAction,
  activeBranch,
  agentsCount,
  onOpenCommitModal,
  onOpenBranchModal,
  onOpenAgentsModal,
}) => {
  return (
    <div
      id="bottom-player-bar"
      className="h-16 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between gap-4 text-slate-200 select-none shrink-0 z-30 shadow-lg shadow-black/40"
    >
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          id="player-toggle-play"
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title={isPlaying ? 'Пауза выполнения' : 'Запуск авто-исполнения'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Пауза</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Старт</span>
            </>
          )}
        </button>

        <button
          id="player-stop"
          onClick={onStop}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          title="Остановить"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          id="player-step-forward"
          onClick={onStepForward}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
          title="Выполнить один шаг"
        >
          <SkipForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Шаг</span>
        </button>

        <button
          id="player-step-backward"
          onClick={onStepBackward}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
          title="Откатить последний шаг"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Откат</span>
        </button>
      </div>

      {/* Center: Live Execution Progress Bar & Current Action */}
      <div className="flex-1 max-w-xl mx-2 flex flex-col justify-center">
        <div className="flex items-center justify-between text-xs mb-1 font-mono">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 relative">
              {isPlaying && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isPlaying ? 'bg-cyan-500' : 'bg-slate-500'
                }`}
              />
            </span>
            <span className="text-slate-400 text-[11px]">Сейчас:</span>
            <span className="text-cyan-300 font-semibold truncate">
              «{currentAction}»
            </span>
          </div>
          <span className="text-slate-200 font-bold ml-2">{progress}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300 relative"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          >
            {isPlaying && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Right: Commit button, Git branch, Active Agents count */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          id="commit-button"
          onClick={onOpenCommitModal}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-900/30"
          title="Зафиксировать изменения в репозитории"
        >
          <Package className="w-3.5 h-3.5" />
          <span>Коммит</span>
        </button>

        <button
          id="branch-selector-button"
          onClick={onOpenBranchModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 border border-slate-700/60 text-xs transition-colors font-mono"
          title="Текущая ветка"
        >
          <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
          <span className="max-w-[150px] truncate">{activeBranch}</span>
        </button>

        <button
          id="agents-status-button"
          onClick={onOpenAgentsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 border border-slate-700/60 text-xs transition-colors"
          title="Активные AI-агенты"
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-cyan-300">{agentsCount}</span>
          <span className="hidden lg:inline text-slate-400">в работе</span>
        </button>
      </div>
    </div>
  );
};
