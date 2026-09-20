import React, { useState, useMemo } from 'react';
import { MindmapNode, HistoryEvent } from '../../types';
import { getNodeHistoryEvents, getNodeHistoryStats } from '../../utils/nodeHistory';
import {
  Clock,
  Package,
  RotateCcw,
  AlertTriangle,
  FileText,
  PlusCircle,
  Play,
  GitPullRequest,
  User,
  Bot,
  Layers,
  ExternalLink,
  X,
  Search,
  CheckCircle2,
  Undo2,
  ChevronDown,
  ChevronRight,
  GitCommit,
  Sparkles,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface NodeHistoryInspectorProps {
  node: MindmapNode | null;
  historyEvents: HistoryEvent[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateToHistoryTab?: (nodeId?: string) => void;
  onRollbackEvent?: (eventId: string) => void;
  onOpenCommitModal?: (nodeId?: string) => void;
}

export const NodeHistoryInspector: React.FC<NodeHistoryInspectorProps> = ({
  node,
  historyEvents,
  isOpen,
  onClose,
  onNavigateToHistoryTab,
  onRollbackEvent,
  onOpenCommitModal,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [diffEvent, setDiffEvent] = useState<HistoryEvent | null>(null);
  const [confirmRollbackId, setConfirmRollbackId] = useState<string | null>(null);

  const nodeEvents = useMemo(() => {
    return getNodeHistoryEvents(historyEvents, node);
  }, [historyEvents, node]);

  const stats = useMemo(() => {
    return getNodeHistoryStats(nodeEvents);
  }, [nodeEvents]);

  const filteredEvents = useMemo(() => {
    return nodeEvents.filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDetails = ev.details?.toLowerCase().includes(q);
        const matchesPr = ev.prNumber?.toLowerCase().includes(q);
        const matchesAuthor = ev.author.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDetails && !matchesPr && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [nodeEvents, filterType, searchQuery]);

  if (!isOpen || !node) return null;

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'commit':
        return <Package className="w-3.5 h-3.5 text-cyan-400" />;
      case 'deploy':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-400" />;
      case 'incident':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'decision':
        return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'node_added':
        return <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />;
      case 'start':
        return <Play className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getEventBadgeColor = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'commit':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80';
      case 'deploy':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'incident':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      case 'decision':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'node_added':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleRollback = (eventId: string) => {
    if (onRollbackEvent) {
      onRollbackEvent(eventId);
    }
    setConfirmRollbackId(null);
  };

  return (
    <div
      id="node-history-inspector"
      className="absolute top-4 right-4 bottom-4 z-30 w-96 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 select-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* 1. Header: Node Info & Quick Actions */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-cyan-950/80 border border-cyan-800 text-cyan-400">
              <Clock className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                История узла
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold whitespace-nowrap">
                {stats.total} {stats.total === 1 ? 'событие' : stats.total < 5 ? 'события' : 'событий'}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-white truncate" title={node.label}>
            {node.label}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <span className="capitalize">{node.category}</span>
            <span>•</span>
            <span className="font-mono text-cyan-300">{node.progress}% завершено</span>
            {node.agent && (
              <>
                <span>•</span>
                <span className="text-slate-300 truncate">{node.agent}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          id="close-node-history-btn"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Закрыть панель истории"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Secondary Bar: Global Audit Link & Commit Action */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
        <button
          onClick={() => onNavigateToHistoryTab && onNavigateToHistoryTab(node.id)}
          id="nav-to-full-history-btn"
          className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
          title="Открыть полный журнал аудита с фильтром по этому узлу"
        >
          <span>Вся история в АУДИТЕ</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        {onOpenCommitModal && (
          <button
            onClick={() => onOpenCommitModal(node.id)}
            id="commit-node-change-btn"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <GitCommit className="w-3 h-3 text-cyan-400" />
            <span>Коммит</span>
          </button>
        )}
      </div>

      {/* 3. Search and Type Filters */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 space-y-2 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по истории узла..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Все ({stats.total})
          </button>
          {stats.commits > 0 && (
            <button
              onClick={() => setFilterType('commit')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'commit'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Коммиты ({stats.commits})
            </button>
          )}
          {stats.deploys > 0 && (
            <button
              onClick={() => setFilterType('deploy')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'deploy'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Деплои ({stats.deploys})
            </button>
          )}
          {stats.incidents > 0 && (
            <button
              onClick={() => setFilterType('incident')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'incident'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Инциденты ({stats.incidents})
            </button>
          )}
          {stats.decisions > 0 && (
            <button
              onClick={() => setFilterType('decision')}
              className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filterType === 'decision'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Решения ({stats.decisions})
            </button>
          )}
        </div>
      </div>

      {/* 4. Timeline Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-300">
                {searchQuery || filterType !== 'all'
                  ? 'Ничего не найдено по фильтрам'
                  : 'История изменений пока пуста'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {searchQuery || filterType !== 'all'
                  ? 'Попробуйте сбросить параметры поиска или выбрать другую категорию'
                  : 'Для этого узла ещё не зафиксированы коммиты или деплои в текущей сессии.'}
              </p>
            </div>
            {onOpenCommitModal && !searchQuery && (
              <button
                onClick={() => onOpenCommitModal(node.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-950"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Зафиксировать первый коммит</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredEvents.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              const isConfirming = confirmRollbackId === ev.id;

              return (
                <div
                  key={ev.id}
                  className="relative group transition-all"
                >
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-cyan-400 transition-colors">
                    {getEventIcon(ev.type)}
                  </div>

                  {/* Event Card */}
                  <div className="rounded-xl border border-slate-800/90 bg-slate-950/70 p-3 hover:border-slate-700 transition-all space-y-2">
                    {/* Header: Title & Time */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white leading-snug break-words flex-1">
                        {ev.title}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {ev.time}
                      </span>
                    </div>

                    {/* Metadata Badges: Type, Status, PR, Author */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded border font-medium uppercase tracking-wider ${getEventBadgeColor(ev.type)}`}>
                        {ev.type}
                      </span>

                      {ev.prNumber && (
                        <span className="px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 flex items-center gap-1 font-mono">
                          <GitPullRequest className="w-2.5 h-2.5" />
                          <span>{ev.prNumber}</span>
                        </span>
                      )}

                      {ev.status && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {ev.status}
                        </span>
                      )}

                      <div className="flex items-center gap-1 text-slate-400 ml-auto truncate max-w-[120px]">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{ev.author}</span>
                      </div>
                    </div>

                    {/* Details Preview / Full Details */}
                    {ev.details && (
                      <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 leading-relaxed">
                        <p className={isExpanded ? '' : 'line-clamp-2'}>
                          {ev.details}
                        </p>
                        {ev.details.length > 90 && (
                          <button
                            onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 font-medium flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Свернуть' : 'Подробнее'}</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Affected Services & Docs tags */}
                    {(ev.servicesAffected || ev.docsAffected) && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {ev.servicesAffected?.map((srv, idx) => (
                          <span
                            key={`srv-${idx}`}
                            className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px]"
                          >
                            ⚙️ {srv}
                          </span>
                        ))}
                        {ev.docsAffected?.map((doc, idx) => (
                          <span
                            key={`doc-${idx}`}
                            className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[9px]"
                          >
                            📄 {doc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Card Actions: Diff & Rollback */}
                    <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setDiffEvent(ev)}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Детали / diff</span>
                      </button>

                      {ev.canRollback && onRollbackEvent && (
                        <div>
                          {isConfirming ? (
                            <div className="flex items-center gap-1 animate-in fade-in duration-150">
                              <span className="text-[10px] text-amber-400">Откатить?</span>
                              <button
                                onClick={() => handleRollback(ev.id)}
                                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Да
                              </button>
                              <button
                                onClick={() => setConfirmRollbackId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                              >
                                Нет
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRollbackId(ev.id)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Откатить это изменение в коде/архитектуре"
                            >
                              <Undo2 className="w-3 h-3" />
                              <span>Откатить</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal for Event Details & Simulated Diff */}
      {diffEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {diffEvent.type} {diffEvent.prNumber}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  {diffEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setDiffEvent(null)}
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Автор:</span>
                  <span className="text-slate-200 font-medium">{diffEvent.author}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Время:</span>
                  <span className="text-slate-200 font-mono">{diffEvent.time}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Агенты:</span>
                  <span className="text-cyan-300">{diffEvent.agents.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Статус:</span>
                  <span className="text-emerald-400 font-medium">{diffEvent.status || 'merged'}</span>
                </div>
              </div>

              {diffEvent.details && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px] font-semibold">Описание:</span>
                  <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                    {diffEvent.details}
                  </p>
                </div>
              )}

              {/* Code Diff Simulation */}
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] font-semibold">Diff патч изменений:</span>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px] overflow-x-auto leading-relaxed">
                  <span className="text-slate-500">@@ -14,6 +14,8 @@ saga_orchestrator</span>{'\n'}
                  <span className="text-slate-400"> const SAGA_STEPS = [</span>{'\n'}
                  <span className="text-rose-400">-  '2PC_LOCK_ACCOUNT',</span>{'\n'}
                  <span className="text-emerald-400">+  'INITIATE_REFUND_EVENT_MESH',</span>{'\n'}
                  <span className="text-emerald-400">+  'ACQUIRING_LIMIT_VERIFY',</span>{'\n'}
                  <span className="text-slate-400">   'SAGA_COMPENSATION_DISPATCH'</span>{'\n'}
                  <span className="text-slate-400"> ];</span>
                </pre>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setDiffEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
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
