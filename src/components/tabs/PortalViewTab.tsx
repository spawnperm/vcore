import React, { useState } from 'react';
import { PortalScreen, UxReviewComment } from '../../types';
import {
  Monitor,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  X,
  CreditCard,
} from 'lucide-react';

interface PortalViewTabProps {
  screens: PortalScreen[];
  selectedScreenId: string;
  onSelectScreen: (screenId: string) => void;
  onDiscussWithAgent: (context: string) => void;
}

export const PortalViewTab: React.FC<PortalViewTabProps> = ({
  screens,
  selectedScreenId,
  onSelectScreen,
  onDiscussWithAgent,
}) => {
  const [viewMode, setViewMode] = useState<'current' | 'after' | 'diff'>('after');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('14200');
  const [refundReason, setRefundReason] = useState('Возврат товара покупателем');
  const [refundStatus, setRefundStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const [reviewPins, setReviewPins] = useState<UxReviewComment[]>([
    {
      id: 'p1',
      screenId: 'screen-orders',
      xPercent: 78,
      yPercent: 32,
      author: 'Иван Петров',
      text: 'Кнопка «Оформить возврат» должна требовать подтверждения и пароль администратора.',
      time: '12 мин назад',
      status: 'open',
    },
  ]);
  const [newPinText, setNewPinText] = useState('');
  const [pendingPinPos, setPendingPinPos] = useState<{ x: number; y: number } | null>(null);

  const currentScreen = screens.find((s) => s.id === selectedScreenId) || screens[0];

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isReviewMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPinPos({ x, y });
  };

  const handleSavePin = () => {
    if (!pendingPinPos || !newPinText.trim()) return;
    const newPin: UxReviewComment = {
      id: `pin-${Date.now()}`,
      screenId: selectedScreenId,
      xPercent: pendingPinPos.x,
      yPercent: pendingPinPos.y,
      author: 'Иван Петров (Архитектор)',
      text: newPinText,
      time: 'Только что',
      status: 'open',
    };
    setReviewPins([...reviewPins, newPin]);
    setPendingPinPos(null);
    setNewPinText('');
  };

  const triggerRefundSimulation = () => {
    setRefundStatus('processing');
    setTimeout(() => {
      setRefundStatus('done');
      setTimeout(() => {
        setRefundModalOpen(false);
        setRefundStatus('idle');
      }, 1500);
    }, 1800);
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left Area: UI Tree Navigation */}
      <div className="w-64 lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-slate-300 uppercase tracking-wider">
            Дерево интерфейса
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">UI Routes</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Section: Продажи */}
          <div>
            <div className="font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>🏢 Продажи</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {screens
                .filter((s) => s.section === '🏢 Продажи')
                .map((screen) => {
                  const isSelected = screen.id === selectedScreenId;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => onSelectScreen(screen.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{screen.title}</span>
                      {isSelected && <span className="text-cyan-400 font-mono text-[11px]">←</span>}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Section: Закупки */}
          <div>
            <div className="font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>🏢 Закупки</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {screens
                .filter((s) => s.section === '🏢 Закупки')
                .map((screen) => {
                  const isSelected = screen.id === selectedScreenId;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => onSelectScreen(screen.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{screen.title}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Section: Склад */}
          <div>
            <div className="font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>🏢 Склад</span>
            </div>
            <div className="space-y-1 pl-4 border-l border-slate-800 ml-2">
              {screens
                .filter((s) => s.section === '🏢 Склад')
                .map((screen) => {
                  const isSelected = screen.id === selectedScreenId;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => onSelectScreen(screen.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{screen.title}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Section: Billing 🆕 */}
          <div>
            <div className="font-semibold text-amber-300 mb-1.5 flex items-center justify-between">
              <span>🏢 Billing</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                🆕 NEW
              </span>
            </div>
            <div className="space-y-1 pl-4 border-l border-amber-800/60 ml-2">
              {screens
                .filter((s) => s.section.includes('Billing'))
                .map((screen) => {
                  const isSelected = screen.id === selectedScreenId;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => onSelectScreen(screen.id)}
                      className={`w-full text-left p-1.5 rounded flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-950/80 text-amber-200 font-bold border border-amber-700'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{screen.title}</span>
                      {isSelected && <span className="text-amber-400 font-mono text-[11px]">←</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Center & Right: Portal View Canvas & Controls */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Control Strip */}
        <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>Вид портала</span>
            </span>

            {/* 3-Mode View Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('current')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === 'current'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>🟢 Сейчас (Прод)</span>
              </button>

              <button
                onClick={() => setViewMode('after')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${
                  viewMode === 'after'
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>🟡 После изменений</span>
              </button>

              <button
                onClick={() => setViewMode('diff')}
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
              onClick={() => setIsReviewMode(!isReviewMode)}
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
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Открыть в новом окне"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diff Summary Bar (visible when Diff mode is active) */}
        {viewMode === 'diff' && currentScreen.diffSummary && (
          <div className="bg-indigo-950/40 border-b border-indigo-900/60 px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-indigo-300 flex items-center gap-1">
                <span>Различия интерфейса:</span>
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                + Добавлено: {currentScreen.diffSummary.added.join(', ')}
              </span>
              {currentScreen.diffSummary.removed.length > 0 && (
                <span className="text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  - Удалено: {currentScreen.diffSummary.removed.join(', ')}
                </span>
              )}
            </div>
            <span className="text-slate-400 text-[11px] font-mono">
              Связано с планом «refund»
            </span>
          </div>
        )}

        {/* Realistic Interactive Simulated Portal Canvas */}
        <div
          onClick={handleCanvasClick}
          className={`flex-1 overflow-y-auto p-6 flex items-center justify-center bg-slate-950 relative ${
            isReviewMode ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          {/* Simulated Browser Window Frame */}
          <div className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col min-h-[500px] text-slate-200 select-none relative">
            {/* Top Browser Bar */}
            <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs">
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
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {viewMode === 'current'
                  ? 'PROD-V2.3'
                  : viewMode === 'after'
                  ? 'STAGE-V2.4'
                  : 'DIFF-OVERLAY'}
              </span>
            </div>

            {/* Portal App Body: Inner Sidebar + Main View */}
            <div className="flex-1 flex min-h-[440px]">
              {/* Inner Portal Mini-Sidebar */}
              <div className="w-48 bg-slate-950/90 border-r border-slate-800/80 p-3 flex flex-col justify-between text-xs shrink-0">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-100 mb-4 px-1">
                    <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-bold">
                      М
                    </div>
                    <span>МИРОВИЗОР</span>
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-2 rounded flex items-center gap-2 ${
                        selectedScreenId === 'screen-orders'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      <span>📁</span>
                      <span>Заказы</span>
                    </div>

                    <div className="p-2 rounded text-slate-400 flex items-center gap-2">
                      <span>📁</span>
                      <span>Воронка</span>
                    </div>

                    <div className="p-2 rounded text-slate-400 flex items-center gap-2">
                      <span>📁</span>
                      <span>Клиенты</span>
                    </div>

                    {/* Billing item: ONLY visible in 'after' or highlighted in 'diff' */}
                    {viewMode === 'current' ? null : (
                      <div
                        className={`p-2 rounded flex items-center justify-between ${
                          viewMode === 'diff'
                            ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-bold'
                            : selectedScreenId === 'screen-billing'
                            ? 'bg-amber-950 text-amber-300 font-semibold'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>💳</span>
                          <span>Billing</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                          🆕
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                    ИП
                  </div>
                  <span className="truncate">Иван Петров</span>
                </div>
              </div>

              {/* Inner Portal Main Content */}
              <div className="flex-1 p-5 bg-slate-900 flex flex-col">
                {/* Simulated Screen: Заказы (Orders) */}
                {selectedScreenId === 'screen-orders' && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="font-bold text-base text-slate-100">
                          Реестр заказов покупателей
                        </h3>
                        <p className="text-xs text-slate-400">
                          Всего 1 248 заказов за текущий месяц
                        </p>
                      </div>

                      {/* Action buttons inside portal */}
                      <div className="flex items-center gap-2">
                        {/* The new refund action button */}
                        {viewMode !== 'current' && (
                          <div className={viewMode === 'diff' ? 'ring-2 ring-emerald-400 rounded-lg p-0.5' : ''}>
                            <button
                              onClick={() => setRefundModalOpen(true)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-900/30"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>+ Оформить возврат (Saga)</span>
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1 rounded">
                                🆕
                              </span>
                            </button>
                          </div>
                        )}
                        <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
                          Экспорт Excel
                        </button>
                      </div>
                    </div>

                    {/* Orders Table */}
                    <div className="mt-4 flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3">Номер заказа</th>
                            <th className="p-3">Клиент</th>
                            <th className="p-3">Сумма</th>
                            <th className="p-3">Статус оплаты</th>
                            {viewMode !== 'current' && (
                              <th
                                className={`p-3 ${
                                  viewMode === 'diff' ? 'text-emerald-400 font-bold bg-emerald-950/40' : ''
                                }`}
                              >
                                Статус возврата 🆕
                              </th>
                            )}
                            <th className="p-3 text-right">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          <tr className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-semibold text-cyan-300">
                              #ORD-98421
                            </td>
                            <td className="p-3">ООО «Вектор Трейд»</td>
                            <td className="p-3 font-mono font-medium">14 200 ₽</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px]">
                                Оплачен
                              </span>
                            </td>
                            {viewMode !== 'current' && (
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono flex items-center gap-1 w-fit ${
                                    viewMode === 'diff'
                                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                  В обработке (60%)
                                </span>
                              </td>
                            )}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => setRefundModalOpen(true)}
                                className="text-cyan-400 hover:text-cyan-300 hover:underline"
                              >
                                {viewMode === 'current' ? 'Подробнее' : 'Возврат →'}
                              </button>
                            </td>
                          </tr>

                          <tr className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-semibold text-cyan-300">
                              #ORD-98420
                            </td>
                            <td className="p-3">ИП Смирнов А.В.</td>
                            <td className="p-3 font-mono font-medium">54 000 ₽</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px]">
                                Оплачен
                              </span>
                            </td>
                            {viewMode !== 'current' && (
                              <td className="p-3 text-slate-500">—</td>
                            )}
                            <td className="p-3 text-right">
                              <button className="text-slate-400 hover:text-slate-200">
                                Подробнее
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Simulated Screen: Billing 🆕 */}
                {selectedScreenId === 'screen-billing' && (
                  <div className="flex-1 flex flex-col">
                    {viewMode === 'current' ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
                        <h4 className="text-slate-300 font-bold text-sm">
                          Страница не найдена (404)
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">
                          Раздел «Billing» отсутствует в текущей версии production (v2.3).
                          Переключитесь на «🟡 После изменений» или «⚪ Diff».
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`flex-1 flex flex-col ${
                          viewMode === 'diff'
                            ? 'ring-2 ring-emerald-500 bg-emerald-950/10 p-2 rounded-xl'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-100">
                                Панель управления возвратами (Billing)
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                                🆕 NEW SAGA
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Оркестратор распределённых транзакций возврата средств
                            </p>
                          </div>
                          <button
                            onClick={() => setRefundModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                          >
                            + Новая транзакция
                          </button>
                        </div>

                        {/* Status Cards */}
                        <div className="grid grid-cols-3 gap-3 my-4">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[11px] text-slate-400">Активные саги</span>
                            <p className="text-lg font-bold text-cyan-300 mt-1">3 транзакции</p>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[11px] text-slate-400">Успешно возвращено</span>
                            <p className="text-lg font-bold text-emerald-400 mt-1">128 400 ₽</p>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                            <span className="text-[11px] text-slate-400">Ср. время закрытия саги</span>
                            <p className="text-lg font-bold text-indigo-400 mt-1">8.4 сек</p>
                          </div>
                        </div>

                        {/* Recent Refund Sagas */}
                        <div className="flex-1 border border-slate-800 rounded-xl p-3 bg-slate-950/60 text-xs">
                          <h4 className="font-semibold text-slate-300 mb-2">
                            Текущая сессия оркестратора (Saga)
                          </h4>
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-mono text-cyan-300 font-bold">
                                SAGA-REF-77492
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Заказ #ORD-98421 · 14 200 ₽ · Инициатор: Иван Петров
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]">
                                Шаг 2/3: Bank Acquirer
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* UX Review Pins placed by user */}
            {reviewPins
              .filter((p) => p.screenId === selectedScreenId)
              .map((pin) => (
                <div
                  key={pin.id}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 group"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500 border-2 border-white text-white font-bold text-xs flex items-center justify-center shadow-lg cursor-pointer animate-bounce">
                    !
                  </div>
                  {/* Tooltip Card */}
                  <div className="hidden group-hover:block absolute left-full top-0 ml-2 w-64 p-2.5 rounded-lg bg-slate-950 border border-rose-500/80 shadow-2xl text-xs z-50 text-slate-100">
                    <div className="flex items-center justify-between text-[10px] text-rose-300 mb-1">
                      <span className="font-semibold">{pin.author}</span>
                      <span>{pin.time}</span>
                    </div>
                    <p className="text-slate-200">{pin.text}</p>
                    <button
                      onClick={() => onDiscussWithAgent(`Заметка ревью: ${pin.text}`)}
                      className="mt-2 text-[10px] text-cyan-400 hover:underline block"
                    >
                      💬 Передать UI-агенту →
                    </button>
                  </div>
                </div>
              ))}

            {/* Pending Pin Input Dialog */}
            {pendingPinPos && (
              <div
                style={{ left: `${pendingPinPos.x}%`, top: `${pendingPinPos.y}%` }}
                className="absolute z-40 -translate-x-1/2 -translate-y-1/2 w-64 p-3 bg-slate-950 border border-cyan-500 rounded-xl shadow-2xl"
              >
                <div className="flex items-center justify-between mb-1.5 text-xs text-cyan-300 font-bold">
                  <span>Добавить UX-заметку</span>
                  <button
                    onClick={() => setPendingPinPos(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  autoFocus
                  value={newPinText}
                  onChange={(e) => setNewPinText(e.target.value)}
                  placeholder="Опишите замечание по дизайну или кнопке..."
                  className="w-full h-16 p-2 bg-slate-900 border border-slate-700 rounded-md text-xs text-slate-100 resize-none focus:outline-none focus:border-cyan-400"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => setPendingPinPos(null)}
                    className="px-2 py-1 text-xs text-slate-400"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSavePin}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                  >
                    Прикрепить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Refund Saga Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    Оформление возврата по заказу #ORD-98421
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Запуск саги: Order → Billing → Bank → Kafka → Notify
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Сумма возврата (₽)</label>
                <input
                  type="text"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Причина возврата</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {refundStatus === 'processing' && (
                <div className="p-3 bg-cyan-950/60 border border-cyan-800 rounded-lg flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-cyan-300 font-mono">
                    Оркестратор Saga: блокировка средств & вызов эквайера...
                  </span>
                </div>
              )}

              {refundStatus === 'done' && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Возврат успешно проведён! Топик Kafka опубликован.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Отмена
              </button>
              <button
                onClick={triggerRefundSimulation}
                disabled={refundStatus !== 'idle'}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-900/40"
              >
                {refundStatus === 'processing' ? 'Выполняется сага...' : 'Подтвердить возврат'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
