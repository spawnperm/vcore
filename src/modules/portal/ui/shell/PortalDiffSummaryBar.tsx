import React from 'react';
import { PortalScreen } from '../../../../types';

interface PortalDiffSummaryBarProps {
  currentScreen: PortalScreen;
}

export const PortalDiffSummaryBar: React.FC<PortalDiffSummaryBarProps> = ({ currentScreen }) => {
  if (!currentScreen.diffSummary) return null;

  return (
    <div className="bg-indigo-950/40 border-b border-indigo-900/60 px-6 py-2 flex items-center justify-between text-xs shrink-0">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-semibold text-indigo-300 flex items-center gap-1">
          <span>Различия интерфейса (DDD Diff):</span>
        </span>
        {currentScreen.diffSummary.added?.length > 0 && (
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            + Добавлено: {currentScreen.diffSummary.added.join(', ')}
          </span>
        )}
        {currentScreen.diffSummary.removed && currentScreen.diffSummary.removed.length > 0 && (
          <span className="text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            - Удалено: {currentScreen.diffSummary.removed.join(', ')}
          </span>
        )}
      </div>
      <span className="text-slate-400 text-[11px] font-mono shrink-0">
        Связано с планом реализации Saga Refund
      </span>
    </div>
  );
};
