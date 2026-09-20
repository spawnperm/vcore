import React, { useState } from 'react';
import { HistoryEvent } from '../../types';
import {
  Package,
  RotateCcw,
  AlertTriangle,
  FileText,
  PlusCircle,
  Play,
  GitPullRequest,
  Search,
  Filter,
  User,
  Bot,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';

interface HistoryTabProps {
  events: HistoryEvent[];
  selectedNodeId: string;
  onSelectNodeAndTab: (nodeId: string, tab: 'plan' | 'docs' | 'portal') => void;
  onOpenPrModal: () => void;
  onRollbackEvent: (eventId: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  events,
  selectedNodeId,
  onSelectNodeAndTab,
  onOpenPrModal,
  onRollbackEvent,
}) => {
  const [authorFilter, setAuthorFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiffEvent, setSelectedDiffEvent] = useState<HistoryEvent | null>(null);
  const [rollbackModalEvent, setRollbackModalEvent] = useState<HistoryEvent | null>(null);
  const [postmortemModalEvent, setPostmortemModalEvent] = useState<HistoryEvent | null>(null);

  const filteredEvents = events.filter((ev) => {
    if (authorFilter !== 'all' && ev.author !== authorFilter) return false;
    if (agentFilter !== 'all' && !ev.agents.some((a) => a.includes(agentFilter))) return false;
    if (searchQuery) {
      const match =
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.prNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'commit':
        return <Package className="w-4 h-4 text-cyan-400" />;
      case 'deploy':
        return <RotateCcw className="w-4 h-4 text-amber-400" />;
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'decision':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'node_added':
        return <PlusCircle className="w-4 h-4 text-indigo-400" />;
      case 'start':
        return <Play className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Filter Bar matching prompt ASCII */}
        <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Хронология изменений (Аудит)</span>
            </span>

            <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Author filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">👤 Все авторы</option>
                <option value="Иван Петров" className="bg-slate-900">Иван Петров</option>
                <option value="Автоматический мониторинг" className="bg-slate-900">Мониторинг</option>
              </select>
            </div>

            {/* Agent filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <Bot className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">🧩 Все агенты</option>
                <option value="Billing" className="bg-slate-900">Billing-агент</option>
                <option value="Инфра" className="bg-slate-900">Инфра-агент</option>
                <option value="Docs" className="bg-slate-900">Docs-агент</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="30d" className="bg-slate-900">📅 30 дней</option>
                <option value="7d" className="bg-slate-900">📅 7 дней</option>
                <option value="24h" className="bg-slate-900">📅 24 часа</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по коммитам, PR, INC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto relative pl-6 border-l-2 border-slate-800 space-y-6">
            {filteredEvents.map((ev) => {
              const isLinkedToCurrent = ev.relatedNodeId === selectedNodeId;

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Dot Marker */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                      ev.type === 'incident'
                        ? 'bg-rose-500 ring-4 ring-rose-950'
                        : isLinkedToCurrent
                        ? 'bg-cyan-400 ring-4 ring-cyan-950 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />

                  {/* Event Card */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isLinkedToCurrent
                        ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Header: Time, Title & Agents */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-cyan-300 font-bold">
                          ● {ev.time}
                        </span>
                        <div className="p-1 rounded bg-slate-950 border border-slate-800">
                          {getEventIcon(ev.type)}
                        </div>
                        <h4 className="font-bold text-sm text-slate-100">{ev.title}</h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">Агенты:</span>
                        {ev.agents.map((agent) => (
                          <span
                            key={agent}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                          >
                            🤖 {agent}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta Bar: PR number, affected services, docs */}
                    {(ev.prNumber || ev.servicesAffected || ev.docsAffected) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-2.5 pb-2 border-b border-slate-800/80">
                        {ev.prNumber && (
                          <span className="font-mono font-bold text-cyan-400 flex items-center gap-1">
                            <GitPullRequest className="w-3.5 h-3.5" />
                            PR {ev.prNumber} · ✅ merged
                          </span>
                        )}
                        {ev.servicesAffected && (
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            🧩 {ev.servicesAffected.join(', ')}
                          </span>
                        )}
                        {ev.docsAffected && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            📄 {ev.docsAffected.join(', ')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Details description */}
                    {ev.details && (
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {ev.details}
                      </p>
                    )}

                    {/* Action Buttons matching prompt specification */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {ev.prNumber && (
                        <button
                          onClick={onOpenPrModal}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                        >
                          <GitPullRequest className="w-3 h-3 text-cyan-400" />
                          <span>Открыть PR</span>
                        </button>
                      )}

                      {ev.relatedNodeId && (
                        <button
                          onClick={() => onSelectNodeAndTab(ev.relatedNodeId!, 'plan')}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>🧠 Миндмап</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedDiffEvent(ev)}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                      >
                        <span>⚪ Diff</span>
                      </button>

                      {ev.canRollback && (
                        <button
                          onClick={() => setRollbackModalEvent(ev)}
                          className="px-2.5 py-1 rounded-md bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Откатить</span>
                        </button>
                      )}

                      {ev.type === 'incident' && (
                        <button
                          onClick={() => setPostmortemModalEvent(ev)}
                          className="px-2.5 py-1 rounded-md bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs flex items-center gap-1 transition-colors"
                        >
                          <span>Постмортем</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Diff Modal */}
      {selectedDiffEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-slate-100">
                Сравнение Diff: {selectedDiffEvent.title}
              </h4>
              <button
                onClick={() => setSelectedDiffEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4">
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`--- a/services/billing/saga.py
+++ b/services/billing/saga.py
@@ -14,6 +14,15 @@ class RefundSagaOrchestrator:
+    async def execute_refund(self, order_id: str, amount: float):
+        # 1. Lock funds
+        await self.db.lock_order_funds(order_id)
+        # 2. Call Bank Acquirer with compensating fallback
+        res = await self.acquirer.post_refund(amount)
+        if not res.success:
+            await self.compensate_failure(order_id)
+            raise RefundFailedException("Bank gateway timeout")
+        # 3. Publish to NATS JetStream
+        await self.nats.publish("orders.v1.refund", {"order": order_id})`}
              </pre>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedDiffEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800 rounded-2xl p-5 shadow-2xl text-slate-200">
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Подтверждение отката (Rollback)</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Вы собираетесь откатить: <strong>{rollbackModalEvent.title}</strong>.
              Ответственный агент автоматически запустит компенсирующие действия и вернёт предыдущую версию в Kubernetes/Git.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRollbackModalEvent(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  onRollbackEvent(rollbackModalEvent.id);
                  setRollbackModalEvent(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                Да, выполнить откат
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Postmortem Modal */}
      {postmortemModalEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-700 rounded-2xl p-5 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Постмортем {postmortemModalEvent.title}</span>
              </div>
              <button
                onClick={() => setPostmortemModalEvent(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-300">
              <div>
                <strong className="text-slate-100">Причина инцидента:</strong>
                <p className="text-slate-400 mt-0.5">
                  Эксклюзивная блокировка таблицы \`payments_ledger\` при выполнении DDL ALTER COLUMN во время пиковой нагрузки.
                </p>
              </div>
              <div>
                <strong className="text-slate-100">Принятые меры:</strong>
                <p className="text-slate-400 mt-0.5">
                  Установлен lock_timeout = 2s в скриптах Flyway; добавлен retry в Saga orchestrator; DBA-агент добавил мониторинг долгоживущих транзакций.
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setPostmortemModalEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
