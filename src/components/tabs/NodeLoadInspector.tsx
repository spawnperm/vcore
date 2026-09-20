import React, { useState } from 'react';
import { DataFlowNode, DataFlowStream } from '../../types';
import {
  Activity,
  Cpu,
  Database,
  Radio,
  Globe,
  User,
  Zap,
  Server,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface NodeLoadInspectorProps {
  node: DataFlowNode;
  streams: DataFlowStream[];
  allNodes: DataFlowNode[];
  onSelectStream: (streamId: string) => void;
  onClose?: () => void;
  isSpikeActive?: boolean;
  onToggleSpike?: () => void;
  onOpenNatsConsole?: () => void;
}

export const NodeLoadInspector: React.FC<NodeLoadInspectorProps> = ({
  node,
  streams,
  allNodes,
  onSelectStream,
  onClose,
  isSpikeActive = false,
  onToggleSpike,
  onOpenNatsConsole,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'load' | 'streams' | 'specs'>('load');

  // Fallback defaults if metrics missing on some node
  const baseMetrics = node.metrics ?? {
    rps: 120,
    peakRps: 280,
    cpuPercent: 35,
    memoryMb: 512,
    memoryLimitMb: 1024,
    p50LatencyMs: 12,
    p95LatencyMs: 34,
    p99LatencyMs: 70,
    errorRate: 0.02,
    replicas: { current: 2, max: 4 },
    activeConnections: 350,
    healthScore: 97,
    uptime: '99.98%',
    networkInMb: 10.5,
    networkOutMb: 24.0,
  };

  // Dynamically compute metrics with load spike if active
  const metrics = isSpikeActive
    ? {
        ...baseMetrics,
        rps: Math.round(baseMetrics.rps * 2.4),
        cpuPercent: Math.min(98, Math.round(baseMetrics.cpuPercent * 1.6 + 15)),
        memoryMb: Math.min(baseMetrics.memoryLimitMb, Math.round(baseMetrics.memoryMb * 1.35)),
        p50LatencyMs: Math.round(baseMetrics.p50LatencyMs * 1.8),
        p95LatencyMs: Math.round(baseMetrics.p95LatencyMs * 2.5),
        p99LatencyMs: Math.round(baseMetrics.p99LatencyMs * 3.2),
        errorRate: Number((baseMetrics.errorRate * 4.5 + 0.15).toFixed(2)),
        activeConnections: Math.round((baseMetrics.activeConnections ?? 300) * 2.1),
        networkInMb: Number(((baseMetrics.networkInMb ?? 10) * 2.2).toFixed(1)),
        networkOutMb: Number(((baseMetrics.networkOutMb ?? 20) * 2.2).toFixed(1)),
        healthScore: Math.max(62, baseMetrics.healthScore - 18),
      }
    : baseMetrics;

  const incomingStreams = streams.filter((s) => s.target === node.id);
  const outgoingStreams = streams.filter((s) => s.source === node.id);

  const getNodeIcon = (type: DataFlowNode['type']) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-sky-400" />;
      case 'db':
        return <Database className="w-4 h-4 text-indigo-400" />;
      case 'queue':
        return <Radio className="w-4 h-4 text-amber-400" />;
      case 'external':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getCpuColor = (cpu: number) => {
    if (cpu >= 80) return 'text-rose-400 bg-rose-500';
    if (cpu >= 60) return 'text-amber-400 bg-amber-500';
    return 'text-emerald-400 bg-emerald-500';
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
    if (score >= 75) return 'text-amber-400 bg-amber-950/80 border-amber-800';
    return 'text-rose-400 bg-rose-950/80 border-rose-800';
  };

  const memoryPercent = Math.round((metrics.memoryMb / metrics.memoryLimitMb) * 100);

  return (
    <div className="w-80 lg:w-[410px] bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
              {getNodeIcon(node.type)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-slate-100 truncate">{node.name}</h4>
                {node.isNew && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold uppercase shrink-0">
                    NEW
                  </span>
                )}
                {node.piiData && (
                  <span className="p-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800" title="PII Данные">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                ID: {node.id} · Слой: {node.layer}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Закрыть панель"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('load')}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
              activeSubTab === 'load'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Нагрузка & Ресурсы
          </button>
          <button
            onClick={() => setActiveSubTab('streams')}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-all ${
              activeSubTab === 'streams'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔄 Потоки ({incomingStreams.length + outgoingStreams.length})
          </button>
          <button
            onClick={() => setActiveSubTab('specs')}
            className={`py-1 px-2.5 rounded-md font-medium text-center transition-all ${
              activeSubTab === 'specs'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚙️ Инфо
          </button>
        </div>

        {/* NATS JetStream Quick Trigger */}
        {(node.id === 'nats-cluster' || node.technology?.includes('NATS')) && onOpenNatsConsole && (
          <button
            id="nats-open-from-inspector-btn"
            type="button"
            onClick={onOpenNatsConsole}
            className="w-full mt-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-semibold flex items-center justify-between shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>NATS 2.10 JetStream Console</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
              Открыть <ArrowUpRight className="w-3 h-3" />
            </span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4 flex-1">
        {/* Load Spike Simulation Banner */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            isSpikeActive
              ? 'bg-rose-950/40 border-rose-600 shadow-lg shadow-rose-950/50'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isSpikeActive ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
              <div>
                <h5 className="text-xs font-bold text-slate-100">
                  {isSpikeActive ? '🔥 Активен стресс-тест нагрузки (+240% RPS)' : 'Стресс-тестирование узла'}
                </h5>
                <p className="text-[10px] text-slate-400">
                  {isSpikeActive
                    ? 'Симуляция пикового потока заказов и возвратов'
                    : 'Проверить поведение и метрики при всплеске'}
                </p>
              </div>
            </div>

            {onToggleSpike && (
              <button
                onClick={onToggleSpike}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  isSpikeActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isSpikeActive ? (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span>Сброс</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Тест</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {activeSubTab === 'load' && (
          <>
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* RPS Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Трафик / RPS</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-cyan-300">
                    {metrics.rps.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">req/s</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Пик: {metrics.peakRps} req/s</span>
                  <span className={metrics.rps > metrics.peakRps * 0.7 ? 'text-amber-400' : 'text-emerald-400'}>
                    {Math.round((metrics.rps / metrics.peakRps) * 100)}% от пика
                  </span>
                </div>
              </div>

              {/* Health Score Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Индекс здоровья</span>
                  {metrics.healthScore >= 90 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      metrics.healthScore >= 90
                        ? 'text-emerald-300'
                        : metrics.healthScore >= 75
                        ? 'text-amber-300'
                        : 'text-rose-300'
                    }`}
                  >
                    {metrics.healthScore}%
                  </span>
                  <span className="text-xs text-slate-400">SLA</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Uptime: {metrics.uptime}</span>
                  <span className="text-slate-300">Errors: {metrics.errorRate}%</span>
                </div>
              </div>
            </div>

            {/* Compute Utilization: CPU & Memory */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Вычислительные ресурсы
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Реплики: {metrics.replicas.current} / {metrics.replicas.max} HPA
                </span>
              </h5>

              {/* CPU Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Нагрузка процессора (CPU)</span>
                  <span className={`font-mono font-bold text-xs ${getCpuColor(metrics.cpuPercent).split(' ')[0]}`}>
                    {metrics.cpuPercent}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${getCpuColor(metrics.cpuPercent).split(' ')[1]}`}
                    style={{ width: `${Math.min(100, metrics.cpuPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0%</span>
                  <span>Порог скейлинга: 75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Memory Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 text-[11px]">Оперативная память (RAM / Heap)</span>
                  <span className="font-mono font-bold text-xs text-indigo-300">
                    {metrics.memoryMb} MB <span className="text-slate-400 font-normal">/ {metrics.memoryLimitMb} MB</span> ({memoryPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      memoryPercent > 85 ? 'bg-rose-500' : memoryPercent > 65 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, memoryPercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Latency Breakdown (P50, P95, P99) */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <h5 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Распределение задержки (Latency SLA)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">мс (ms)</span>
              </h5>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">P50 (Медиана)</span>
                  <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                    {metrics.p50LatencyMs} <span className="text-[10px] font-normal">мс</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">P95</span>
                  <p className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                    {metrics.p95LatencyMs} <span className="text-[10px] font-normal">мс</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">P99 (Хвост)</span>
                  <p
                    className={`text-base font-bold font-mono mt-0.5 ${
                      metrics.p99LatencyMs > 150 ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {metrics.p99LatencyMs} <span className="text-[10px] font-normal">мс</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Network & Connections Metrics */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <h5 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Сетевая активность и пул соединений
              </h5>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">Входящий / Исходящий трафик</span>
                  <span className="font-mono text-slate-200 font-semibold mt-0.5">
                    ↓ {metrics.networkInMb ?? 12} / ↑ {metrics.networkOutMb ?? 24} MB/s
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400">Активные соединения / Пул</span>
                  <span className="font-mono text-cyan-300 font-semibold mt-0.5">
                    {metrics.activeConnections ?? 420} соединений
                  </span>
                </div>
              </div>

              {metrics.queueLag !== undefined && (
                <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/80 flex items-center justify-between text-xs">
                  <span className="text-amber-300 text-[11px] font-medium">Очередь сообщений (Consumer Lag):</span>
                  <span className="font-mono font-bold text-amber-200">{metrics.queueLag} msg lag</span>
                </div>
              )}
            </div>
          </>
        )}

        {activeSubTab === 'streams' && (
          <div className="space-y-3">
            {/* Incoming Streams */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Входящие потоки данных ({incomingStreams.length})</span>
              </div>

              {incomingStreams.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
                  Нет прямых входящих потоков
                </p>
              ) : (
                <div className="space-y-1.5">
                  {incomingStreams.map((s) => {
                    const sourceNode = allNodes.find((n) => n.id === s.source);
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectStream(s.id)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-600 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                              {sourceNode?.name ?? s.source}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                              {s.protocol}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.throughput} · {s.latency}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outgoing Streams */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                <span>Исходящие потоки данных ({outgoingStreams.length})</span>
              </div>

              {outgoingStreams.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-950 rounded-lg border border-slate-800">
                  Нет прямых исходящих потоков
                </p>
              ) : (
                <div className="space-y-1.5">
                  {outgoingStreams.map((s) => {
                    const targetNode = allNodes.find((n) => n.id === s.target);
                    return (
                      <div
                        key={s.id}
                        onClick={() => onSelectStream(s.id)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-600 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                              {targetNode?.name ?? s.target}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                              {s.protocol}
                            </span>
                            {s.state === 'problem' && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Проблема / SLA" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.throughput} · {s.latency}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'specs' && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-200 text-xs">Технический стек & Версия</h5>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Технология:</span>
                <span className="font-mono text-slate-200">{node.technology ?? 'Cloud Native Service'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Версия билда:</span>
                <span className="font-mono text-cyan-300">{node.version ?? 'v1.0.0'}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Категория:</span>
                <span className="capitalize text-slate-200">{node.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Архитектурный слой:</span>
                <span className="font-mono text-slate-200">{node.layer}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-200 text-xs">Политики безопасности & PII</h5>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">PII данные:</span>
                <span className={node.piiData ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                  {node.piiData ? 'Обрабатывает / Хранит' : 'Отсутствуют'}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">TLS Encryption:</span>
                <span className="text-emerald-400 font-mono">TLS 1.3 / mTLS Enforced</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RBAC / Scopes:</span>
                <span className="font-mono text-slate-300">system.internal, billing.refund</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
