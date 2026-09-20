import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Server,
  Activity,
  Layers,
  Database,
  Terminal,
  X,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { nats } from '../services/nats/natsService';
import { NatsMessage, JetStreamStreamState, NatsClusterNode } from '../services/nats/types';

interface NatsConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'pubsub' | 'streams' | 'kv' | 'monitor';
}

export const NatsConsoleModal: React.FC<NatsConsoleModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pubsub' | 'streams' | 'kv' | 'monitor'>(
    initialTab
  );

  // Live data from nats singleton
  const [stats, setStats] = useState(nats.getStats());
  const [messages, setMessages] = useState<NatsMessage[]>(nats.getMessageLog(50));
  const [streams, setStreams] = useState<JetStreamStreamState[]>(nats.getStreams());
  const [selectedStream, setSelectedStream] = useState<string>('BILLING_SAGAS');
  const [streamMessages, setStreamMessages] = useState<NatsMessage[]>([]);

  // KV State
  const [kvBuckets, setKvBuckets] = useState<string[]>(nats.getKvBuckets());
  const [selectedBucket, setSelectedBucket] = useState<string>('saga-state');
  const [bucketKeys, setBucketKeys] = useState<string[]>([]);
  const [newKvKey, setNewKvKey] = useState('');
  const [newKvVal, setNewKvVal] = useState('{\n  "status": "ACTIVE"\n}');

  // PubSub workbench state
  const [subject, setSubject] = useState('orders.v1.created');
  const [patternType, setPatternType] = useState<'pubsub' | 'rpc'>('pubsub');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(
      {
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        clientId: 'cli-004',
        amount: 24500,
        currency: 'RUB',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  const [pubResult, setPubResult] = useState<{
    success: boolean;
    durationMs: number;
    seq?: number;
    stream?: string;
    replyData?: any;
    msgId: string;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Monitor filter
  const [monitorFilter, setMonitorFilter] = useState('');

  // Sync state on open and tab changes
  const refreshData = () => {
    setStats(nats.getStats());
    setMessages(nats.getMessageLog(50));
    setStreams(nats.getStreams());
    setKvBuckets(nats.getKvBuckets());
    if (selectedStream) {
      setStreamMessages(nats.getStreamMessages(selectedStream, 30));
    }
    if (selectedBucket) {
      setBucketKeys(nats.kvListKeys(selectedBucket));
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, selectedStream, selectedBucket]);

  // Periodic subtle tick for active rates
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setStats(nats.getStats());
      setMessages(nats.getMessageLog(50));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const parsedData = JSON.parse(payloadText);
      const start = performance.now();

      if (patternType === 'rpc') {
        const reply = await nats.request(subject, parsedData, 2000);
        const duration = Math.round((performance.now() - start) * 100) / 100;
        setPubResult({
          success: true,
          durationMs: duration,
          replyData: reply,
          msgId: 'rpc-ack-' + Math.random().toString(36).substring(2, 7),
        });
      } else {
        const published = nats.publish(subject, parsedData);
        const duration = Math.round((performance.now() - start) * 100) / 100;
        setPubResult({
          success: true,
          durationMs: duration,
          seq: published.seq,
          stream: published.stream,
          msgId: published.id,
        });
      }
      refreshData();
    } catch (err: any) {
      setPubResult({
        success: false,
        durationMs: 0,
        replyData: { error: err.message || 'Publishing error' },
        msgId: 'err-' + Date.now(),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKvSave = () => {
    if (!newKvKey.trim()) return;
    try {
      const parsed = JSON.parse(newKvVal);
      nats.kvPut(selectedBucket, newKvKey.trim(), parsed);
      setNewKvKey('');
      refreshData();
    } catch (e: any) {
      alert('Ошибка парсинга JSON: ' + e.message);
    }
  };

  const filteredMessages = useMemo(() => {
    if (!monitorFilter.trim()) return messages;
    const q = monitorFilter.toLowerCase();
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        JSON.stringify(m.data).toLowerCase().includes(q) ||
        (m.stream && m.stream.toLowerCase().includes(q))
    );
  }, [messages, monitorFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  NATS 2.10 JetStream Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cluster Online (3/3 Raft)
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Cluster: <span className="text-cyan-300">nats-corp-mesh</span> • Leader:{' '}
                <span className="text-amber-300">nats-core-1</span> • Latency P50:{' '}
                <span className="text-emerald-400 font-bold">0.8 ms</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
              title="Обновить метрики"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Кластер & Метрики
          </button>
          <button
            onClick={() => setActiveTab('pubsub')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'pubsub'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Live Pub/Sub & RPC
          </button>
          <button
            onClick={() => setActiveTab('streams')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'streams'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Потоки JetStream ({streams.length})
          </button>
          <button
            onClick={() => setActiveTab('kv')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'kv'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Key-Value Store ({kvBuckets.length})
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'monitor'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Монитор событий ({messages.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40">
          {/* TAB 1: OVERVIEW & CLUSTER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Скорость обработки
                  </div>
                  <div className="text-xl font-bold text-white mt-1 flex items-baseline gap-1 font-mono">
                    {stats.msgRateSec.toLocaleString()}
                    <span className="text-xs text-emerald-400 font-normal">msg/s</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> P99 Latency: 1.6 ms
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Обработано сообщений
                  </div>
                  <div className="text-xl font-bold text-cyan-300 mt-1 font-mono">
                    {stats.totalMessages.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Трафик: {stats.totalBytes}</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Активные подписки
                  </div>
                  <div className="text-xl font-bold text-amber-300 mt-1 font-mono">
                    {stats.activeSubscriptions}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    JetStream Streams: {stats.streamCount}
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Потребление памяти
                  </div>
                  <div className="text-xl font-bold text-purple-300 mt-1 font-mono">~122 MB</div>
                  <div className="text-[10px] text-emerald-400 mt-1">vs &gt;4000 MB в тяжеловесных брокерах</div>
                </div>
              </div>

              {/* Raft Cluster Nodes */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    3-Узловой Raft-Кластер NATS Core & JetStream
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Кворум: 2/3 (Достигнут)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {stats.nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        node.isLeader
                          ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              node.isLeader ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-100 font-mono">
                            {node.name}
                          </span>
                        </div>
                        {node.isLeader ? (
                          <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded text-[10px] font-bold uppercase tracking-wider">
                            Raft Leader
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]">
                            Follower
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 space-y-1 text-[11px] font-mono text-slate-300">
                        <div className="flex justify-between text-slate-400">
                          <span>Хост/Порт:</span>
                          <span className="text-slate-200">
                            {node.host}:{node.port}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>RTT задержка:</span>
                          <span className="text-emerald-400 font-bold">{node.rttMs} ms</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Подключения:</span>
                          <span className="text-slate-200">{node.activeConnections}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>RAM / CPU:</span>
                          <span className="text-purple-300">
                            {node.memoryMb} MB ({node.cpuPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NATS JetStream architecture advantages */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  Преимущества NATS JetStream в архитектуре портала (ADR-043)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-semibold block mb-1">⚡ Сверхнизкая задержка</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      P99 задержка составляет 1.6 мс (SLA &lt; 5 мс), обеспечивая моментальное
                      выполнение саги возвратов.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-purple-400 font-semibold block mb-1">🗃️ Встроенный Key-Value</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Устранена необходимость в отдельном Redis для хранения состояний саг и
                      фиче-флагов — используется JetStream KV.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-1">🔄 Request-Reply RPC</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Нативная поддержка паттерна запрос-ответ через инбоксы (`_INBOX.xyz`) без
                      создания временных топиков.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE PUBSUB & RPC BENCH */}
          {activeTab === 'pubsub' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Publisher form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Send className="w-4 h-4 text-cyan-400" />
                    Тестовый стенд отправки сообщений
                  </h3>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setPatternType('pubsub')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        patternType === 'pubsub'
                          ? 'bg-cyan-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Pub / Sub
                    </button>
                    <button
                      onClick={() => setPatternType('rpc')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        patternType === 'rpc'
                          ? 'bg-cyan-600 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Request-Reply (RPC)
                    </button>
                  </div>
                </div>

                {/* Preset Subject Buttons */}
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">
                    Популярные субъекты (Subject):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'orders.v1.created',
                      'billing.saga.refund.validate',
                      'billing.saga.refund.execute',
                      'audit.billing.refunds',
                      'portal.events.OrderCreated',
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className={`text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                          subject === s
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Целевой субъект:</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. orders.v1.created"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs text-slate-400">JSON полезная нагрузка (Payload):</label>
                    <button
                      type="button"
                      onClick={() => {
                        setPayloadText(
                          JSON.stringify(
                            {
                              orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
                              clientId: 'cli-004',
                              amount: Math.floor(5000 + Math.random() * 45000),
                              currency: 'RUB',
                              timestamp: new Date().toISOString(),
                            },
                            null,
                            2
                          )
                        );
                      }}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Случайный заказ
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPublishing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : patternType === 'rpc' ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {patternType === 'rpc' ? 'Отправить RPC-запрос (_INBOX)' : 'Опубликовать в NATS'}
                </button>
              </div>

              {/* Execution Result Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-semibold text-slate-300">
                      Результат выполнения
                    </span>
                    {pubResult && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pubResult.success
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {pubResult.success ? 'ACKNOWLEDGED' : 'ERROR'}
                      </span>
                    )}
                  </div>

                  {pubResult ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Задержка (Latency):</span>
                          <span className="text-emerald-400 font-bold">
                            {pubResult.durationMs} ms
                          </span>
                        </div>
                        {pubResult.stream && (
                          <div className="flex justify-between text-slate-400">
                            <span>Назначенный Stream:</span>
                            <span className="text-cyan-300 font-bold">{pubResult.stream}</span>
                          </div>
                        )}
                        {pubResult.seq && (
                          <div className="flex justify-between text-slate-400">
                            <span>JetStream Sequence (#):</span>
                            <span className="text-amber-300 font-bold">{pubResult.seq}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400">
                          <span>Message ID:</span>
                          <span className="text-slate-300 text-[11px]">{pubResult.msgId}</span>
                        </div>
                      </div>

                      {pubResult.replyData && (
                        <div>
                          <div className="text-[11px] text-cyan-400 mb-1 font-semibold">
                            Ответ микросервиса (RPC Reply):
                          </div>
                          <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-200 overflow-x-auto">
                            {JSON.stringify(pubResult.replyData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                      <Zap className="w-8 h-8 text-slate-700 mb-2" />
                      Отправьте сообщение для проверки маршрутизации и задержки
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Все события заказов и биллинга автоматически сохраняются в персистентный журнал
                  JetStream.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JETSTREAM STREAMS */}
          {activeTab === 'streams' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stream List */}
              <div className="space-y-2 lg:col-span-1">
                <div className="text-xs font-semibold text-slate-300 mb-2">Активные потоки:</div>
                {streams.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => {
                      setSelectedStream(s.name);
                      setStreamMessages(nats.getStreamMessages(s.name, 30));
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedStream === s.name
                        ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white font-mono">{s.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                        R=3 Raft
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Сообщений:</span>
                      <span className="font-mono text-cyan-300 font-bold">{s.messages}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Последний Seq:</span>
                      <span className="font-mono text-amber-300">#{s.lastSeq}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Stream Details & Messages */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200 font-mono">
                        Stream: {selectedStream}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {nats.getStream(selectedStream)?.config.description}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/20">
                      {nats.getStream(selectedStream)?.config.retention.toUpperCase()}
                    </span>
                  </div>

                  {/* Stream subjects pattern */}
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <span className="text-slate-400">Паттерны субъектов:</span>
                    <div className="flex gap-1">
                      {nats.getStream(selectedStream)?.config.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="px-2 py-0.5 bg-slate-950 text-cyan-300 border border-slate-800 rounded font-mono text-[11px]"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Messages table */}
                  <div className="text-xs font-semibold text-slate-300 mb-1.5">
                    Сохранённые сообщения в потоке ({streamMessages.length}):
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {streamMessages.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        Нет сохранённых сообщений
                      </div>
                    ) : (
                      streamMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono"
                        >
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="text-amber-400 font-bold">Seq #{msg.seq}</span>
                            <span className="text-cyan-300">{msg.subject}</span>
                            <span className="text-slate-500 text-[10px]">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="text-[11px] text-slate-300 overflow-x-auto bg-slate-900/60 p-2 rounded">
                            {JSON.stringify(msg.data, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KEY-VALUE STORE */}
          {activeTab === 'kv' && (
            <div className="space-y-4">
              {/* Bucket Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">Бакет Key-Value:</span>
                  <div className="flex gap-1">
                    {kvBuckets.map((bucket) => (
                      <button
                        key={bucket}
                        onClick={() => {
                          setSelectedBucket(bucket);
                          setBucketKeys(nats.kvListKeys(bucket));
                        }}
                        className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                          selectedBucket === bucket
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        $KV.{bucket}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bucket Keys and Values */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Keys list */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Ключи в бакете ({bucketKeys.length})</span>
                    <span className="text-[10px] text-slate-500">Atomic revisions</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {bucketKeys.map((key) => {
                      const entry = nats.kvGet(selectedBucket, key);
                      return (
                        <div
                          key={key}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                        >
                          <div className="flex justify-between items-center mb-1 font-mono">
                            <span className="font-bold text-cyan-300">{key}</span>
                            <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded">
                              Rev #{entry?.revision}
                            </span>
                          </div>
                          <pre className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded overflow-x-auto font-mono">
                            {JSON.stringify(entry?.value, null, 2)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add / Update key */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    Записать значение (PUT key-value)
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Ключ:</label>
                    <input
                      type="text"
                      value={newKvKey}
                      onChange={(e) => setNewKvKey(e.target.value)}
                      placeholder="e.g. acquirer.timeout.ms или saga-77493"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Значение (JSON / Number / String):</label>
                    <textarea
                      rows={5}
                      value={newKvVal}
                      onChange={(e) => setNewKvVal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleKvSave}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Сохранить в KV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REAL-TIME MONITOR */}
          {activeTab === 'monitor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={monitorFilter}
                    onChange={(e) => setMonitorFilter(e.target.value)}
                    placeholder="Фильтр по субъекту (orders.>, billing.*, saga, client)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => {
                    nats.clearMessageLog();
                    refreshData();
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-800 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Очистить журнал
                </button>
              </div>

              {/* Log List */}
              <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Сообщений не найдено. Отправьте тестовые сообщения во вкладке Live Pub/Sub.
                  </div>
                ) : (
                  filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="font-bold text-cyan-300">{msg.subject}</span>
                          {msg.stream && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded">
                              {msg.stream} #{msg.seq}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Спецификация ADR-043 активна • NATS JetStream 2.10</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
