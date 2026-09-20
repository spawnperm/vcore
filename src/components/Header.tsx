import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Database,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  currentOrg: string;
  onOrgChange: (org: string) => void;
  onOpenSearch: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isVoiceListening?: boolean;
  onToggleVoice?: () => void;
  isSavingStorage?: boolean;
  lastStorageSaved?: Date | null;
  onResetStorage?: () => void;
  onOpenNats?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentOrg,
  onOrgChange,
  onOpenSearch,
  searchQuery,
  onSearchChange,
  isVoiceListening = false,
  onToggleVoice,
  isSavingStorage = false,
  lastStorageSaved,
  onResetStorage,
  onOpenNats,
}) => {
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const orgs = [
    'ООО Ромашка',
    'АО СберТехнологии',
    'ПАО ГазпромНефть Цифра',
    'Яндекс Корпоративные Сервисы',
  ];

  const notifications = [
    {
      id: 'n1',
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      title: 'Billing-агент: сгенерирован saga.py',
      desc: 'Паттерн Saga с компенсирующей транзакцией готов к ревью',
      time: '2 мин назад',
      unread: true,
    },
    {
      id: 'n2',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      title: 'Таймаут шлюза эквайера: 380мс',
      desc: 'Превышен SLA (250мс), активирован резервный маршрут',
      time: '18 мин назад',
      unread: true,
    },
    {
      id: 'n3',
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      title: 'ADR-042 обновлён агентом Docs',
      desc: 'Добавлены спецификации возврата для OpenAPI 3.0',
      time: '34 мин назад',
      unread: false,
    },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 text-slate-100 flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left: Brand & Org Switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-cyan-900/30 shrink-0">
            М
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-slate-100 leading-none">
                МИРОВИЗОР
              </span>
            </div>

            {/* Organization Switcher Dropdown placed on the position of former subtitle */}
            <div className="relative mt-0.5">
              <button
                id="org-switcher-button"
                type="button"
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="group flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer py-0.5"
                title="Сменить организацию / тенант"
              >
                <Building2 className="w-3 h-3 text-cyan-500/80 group-hover:text-cyan-400 shrink-0" />
                <span className="font-medium max-w-[145px] truncate">{currentOrg}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-500 group-hover:text-cyan-400 shrink-0 transition-transform ${
                    orgDropdownOpen ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {orgDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setOrgDropdownOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-xl shadow-black/40 py-1 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      Организации и тенанты
                    </div>
                    {orgs.map((org) => (
                      <button
                        key={org}
                        type="button"
                        onClick={() => {
                          onOrgChange(org);
                          setOrgDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                          currentOrg === org ? 'text-cyan-400 font-semibold bg-slate-800/50' : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{org}</span>
                        {currentOrg === org && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center: Search input & Quick navigation + Web Speech Voice Input */}
      <div className="flex-1 max-w-md mx-4 hidden md:flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск узлов, ADR, экранов UI, топиков (⌘K)..."
            onClick={onOpenSearch}
            className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-200 rounded-lg pl-9 pr-14 py-1.5 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Notifications & Live Status (with margin-right to prevent overlap with sidebar collapse toggle) */}
      <div className="flex items-center gap-2 mr-9 sm:mr-10">
        {/* Local Storage Sync Indicator */}
        <div
          id="local-storage-sync-badge"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-inner"
          title={
            isSavingStorage
              ? 'Синхронизация данных с localStorage...'
              : `Состояние сохранено в localStorage${lastStorageSaved ? ` (${lastStorageSaved.toLocaleTimeString()})` : ''}`
          }
        >
          {isSavingStorage ? (
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
          ) : (
            <Database className="w-3 h-3 text-emerald-400" />
          )}
          <span className="text-slate-400">sync:</span>
          <span className={isSavingStorage ? 'text-amber-300 font-semibold' : 'text-emerald-400 font-semibold'}>
            {isSavingStorage ? 'сохранение' : 'localStorage'}
          </span>
          {onResetStorage && (
            <button
              id="reset-storage-btn"
              type="button"
              onClick={onResetStorage}
              className="ml-1 text-[10px] text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
              title="Сбросить локальное хранилище до заводских настроек"
            >
              (сброс)
            </button>
          )}
        </div>

        {/* DSH Gateway & Live API Status */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">dsh:</span>
            <span className="text-amber-300 font-semibold">gemini-3.8-flash</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>live-3.8</span>
          </div>
        </div>

        {/* NATS JetStream Status & Trigger */}
        {onOpenNats && (
          <button
            id="nats-console-trigger-btn"
            type="button"
            onClick={onOpenNats}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/40 text-[11px] font-mono text-cyan-300 shadow-sm transition-all cursor-pointer group"
            title="Открыть NATS JetStream Console (ADR-043)"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">NATS 2.10</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            id="notifications-button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Уведомления агентов"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full ring-2 ring-slate-900" />
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">
                  События агентов (3)
                </span>
                <span className="text-[10px] text-cyan-400 hover:underline cursor-pointer">
                  Прочитать все
                </span>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 hover:bg-slate-800/60 transition-colors flex gap-2.5 cursor-pointer"
                  >
                    <div className="mt-0.5">{n.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {n.desc}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                        {n.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
};
