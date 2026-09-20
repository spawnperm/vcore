import React from 'react';
import { ViewMode } from './PortalTopBar';
import { ShoppingCart, CreditCard, TrendingUp, Users, Truck, FileText, Boxes, Database, Layers } from 'lucide-react';

interface PortalBrowserFrameProps {
  selectedScreenId: string;
  viewMode: ViewMode;
  onSelectScreen: (screenId: string) => void;
  children: React.ReactNode;
}

export const PortalBrowserFrame: React.FC<PortalBrowserFrameProps> = ({
  selectedScreenId,
  viewMode,
  onSelectScreen,
  children,
}) => {
  const menuItems = [
    { id: 'screen-orders', label: 'Заказы', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
    { id: 'screen-funnel', label: 'Воронка', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'screen-clients', label: 'Клиенты', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'screen-suppliers', label: 'Поставщики', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'screen-contracts', label: 'Договоры', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'screen-inventory', label: 'Остатки', icon: <Boxes className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col min-h-[540px] text-slate-200 select-none relative">
      {/* Top Browser Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-mono text-[11px] ml-2">
            https://portal.romashka.internal/app/{selectedScreenId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {viewMode === 'current'
              ? 'PROD-V2.3'
              : viewMode === 'after'
              ? 'STAGE-V2.4'
              : 'DIFF-OVERLAY'}
          </span>
        </div>
      </div>

      {/* Portal App Body: Inner Sidebar + Main View */}
      <div className="flex-1 flex min-h-[480px]">
        {/* Inner Portal Mini-Sidebar */}
        <div className="w-48 bg-slate-950/90 border-r border-slate-800/80 p-3 flex flex-col justify-between text-xs shrink-0">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-100 mb-4 px-1">
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                М
              </div>
              <span className="tracking-wide">МИРОВИЗОР</span>
            </div>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = selectedScreenId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectScreen(item.id)}
                    className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-cyan-300 font-semibold shadow-inner'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Billing item: ONLY visible in 'after' or highlighted in 'diff' */}
              {viewMode === 'current' ? null : (
                <button
                  onClick={() => onSelectScreen('screen-billing')}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                    viewMode === 'diff'
                      ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-bold'
                      : selectedScreenId === 'screen-billing'
                      ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Billing</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                    🆕
                  </span>
                </button>
              )}

              {/* Custom Builder item */}
              <div className="pt-2 mt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectScreen('screen-custom-builder')}
                  className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                    selectedScreenId === 'screen-custom-builder'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-cyan-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">Конструктор</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono">
                    NocoBase
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
              ИП
            </div>
            <div className="truncate">
              <p className="text-slate-200 font-medium leading-none">Иван Петров</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Архитектор решений</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-5 bg-slate-900 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
