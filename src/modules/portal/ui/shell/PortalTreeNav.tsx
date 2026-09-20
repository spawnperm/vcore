import React, { useState, useEffect } from 'react';
import { PortalScreen } from '../../../../types';
import { ShoppingCart, CreditCard, Users, Briefcase, Boxes, ChevronRight, Layers, Database } from 'lucide-react';
import { screenRepository } from '../../../nocobase/ui-schema/screenRepository';

interface PortalTreeNavProps {
  screens: PortalScreen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
}

interface ContextGroup {
  id: string;
  title: string;
  badge?: string;
  icon: React.ReactNode;
  screens: PortalScreen[];
}

export const PortalTreeNav: React.FC<PortalTreeNavProps> = ({
  screens,
  selectedScreenId,
  onSelectScreen,
}) => {
  const groups: ContextGroup[] = [
    {
      id: 'sales',
      title: 'Продажи (Sales)',
      icon: <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />,
      screens: screens.filter(
        (s) => s.id === 'screen-orders' || (s.section === '🏢 Продажи' && s.id !== 'screen-funnel' && s.id !== 'screen-clients')
      ),
    },
    {
      id: 'billing',
      title: 'Биллинг & Saga',
      badge: 'NEW',
      icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
      screens: screens.filter((s) => s.id === 'screen-billing' || s.section.includes('Billing')),
    },
    {
      id: 'crm',
      title: 'CRM & Клиенты',
      icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
      screens: screens.filter((s) => s.id === 'screen-funnel' || s.id === 'screen-clients'),
    },
    {
      id: 'procurement',
      title: 'Закупки (Procurement)',
      icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
      screens: screens.filter((s) => s.id === 'screen-suppliers' || s.id === 'screen-contracts'),
    },
    {
      id: 'inventory',
      title: 'Склад (Inventory)',
      icon: <Boxes className="w-3.5 h-3.5 text-orange-400" />,
      screens: screens.filter((s) => s.id === 'screen-inventory' || s.section === '🏢 Склад'),
    },
    {
      id: 'custom_collections',
      title: 'Конструктор & Справочники',
      badge: 'NOCOBASE',
      icon: <Database className="w-3.5 h-3.5 text-cyan-400" />,
      screens: [
        {
          id: 'screen-custom-builder',
          title: '🛠️ Конструктор экранов',
          section: '🏢 Пользовательские справочники',
          isNew: true,
        },
        ...screens.filter(
          (s) =>
            s.section === '🏢 Пользовательские справочники' &&
            s.id !== 'screen-custom-builder'
        ),
      ],
    },
  ];

  return (
    <div className="w-64 lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-200 uppercase tracking-wider block">
            Модули портала (DDD)
          </span>
          <span className="text-[10px] text-slate-500">Ограниченные контексты</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
          Bounded Contexts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            <div className="font-semibold text-slate-300 px-1 py-1 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                {group.icon}
                <span>{group.title}</span>
              </div>
              {group.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                  {group.badge}
                </span>
              )}
            </div>

            <div className="space-y-0.5 pl-3 border-l border-slate-800 ml-2">
              {group.screens.map((screen) => {
                const isSelected = screen.id === selectedScreenId;
                return (
                  <button
                    key={screen.id}
                    onClick={() => onSelectScreen(screen.id)}
                    className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{screen.title}</span>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
