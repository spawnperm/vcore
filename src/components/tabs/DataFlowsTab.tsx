import React, { useState } from 'react';
import { DataFlowNode, DataFlowStream } from '../../types';
import {
  Layers,
  Database,
  Radio,
  Globe,
  Shield,
  AlertTriangle,
  Clock,
  Activity,
  User,
  Cpu,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Code,
  Lock,
} from 'lucide-react';

interface DataFlowsTabProps {
  nodes: DataFlowNode[];
  streams: DataFlowStream[];
  selectedStreamId?: string;
  onSelectStream?: (streamId: string) => void;
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export const DataFlowsTab: React.FC<DataFlowsTabProps> = ({
  nodes,
  streams,
  selectedNodeId,
  onSelectNode,
}) => {
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    services: true,
    db: true,
    queues: true,
    external: true,
  });
  const [showPiiLayer, setShowPiiLayer] = useState(false);
  const [diffMode, setDiffMode] = useState<'after' | 'current'>('after');
  const [activeInspectionStream, setActiveInspectionStream] = useState<DataFlowStream | null>(
    streams.find((s) => s.state === 'problem') || streams[0]
  );

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getStreamColor = (stream: DataFlowStream) => {
    if (showPiiLayer && stream.piiSensitive) return '#f59e0b'; // Gold for PII
    switch (stream.state) {
      case 'problem':
        return '#f43f5e'; // Red
      case 'modified':
        return '#eab308'; // Yellow
      case 'planned':
        return '#94a3b8'; // Slate/White
      case 'active':
      default:
        return '#06b6d4'; // Cyan
    }
  };

  const visibleNodes = nodes.filter((n) => activeLayers[n.layer]);
  const visibleStreams = streams.filter((s) => {
    if (diffMode === 'current' && s.isNew) return false;
    const src = nodes.find((n) => n.id === s.source);
    const tgt = nodes.find((n) => n.id === s.target);
    return src && tgt && activeLayers[src.layer] && activeLayers[tgt.layer];
  });

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden relative">
      {/* Main Flow Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Top Control Bar: Layer Toggles & Filters */}
        <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 shrink-0">
          {/* Layer toggles */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] mr-1">
              Слой:
            </span>

            <button
              onClick={() => toggleLayer('services')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                activeLayers.services
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>🧩 Сервисы</span>
            </button>

            <button
              onClick={() => toggleLayer('db')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                activeLayers.db
                  ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>🗄️ БД</span>
            </button>

            <button
              onClick={() => toggleLayer('queues')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                activeLayers.queues
                  ? 'bg-amber-950/80 border-amber-700 text-amber-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>📨 Очереди</span>
            </button>

            <button
              onClick={() => toggleLayer('external')}
              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                activeLayers.external
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Внешние</span>
            </button>
          </div>

          {/* Right Tools: PII Layer toggle & Diff */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowPiiLayer(!showPiiLayer)}
              className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                showPiiLayer
                  ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{showPiiLayer ? 'Слой PII: ВКЛ' : '🔐 Слой PII / Маскирование'}</span>
            </button>

            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setDiffMode('current')}
                className={`px-2.5 py-0.5 rounded ${
                  diffMode === 'current' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Сейчас
              </button>
              <button
                onClick={() => setDiffMode('after')}
                className={`px-2.5 py-0.5 rounded ${
                  diffMode === 'after' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                После изменений 🆕
              </button>
            </div>
          </div>
        </div>

        {/* Legend Bar matching prompt ASCII */}
        <div className="px-6 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>🔵 активный поток</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>🟡 изменённый</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 font-medium">🔴 проблема (таймаут)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>⚪ запланирован</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 italic">
            Кликните на поток для просмотра схемы данных, задержки и логов
          </span>
        </div>

        {/* Canvas Area with Animated SVG Streams */}
        <div className="flex-1 relative overflow-hidden bg-slate-950 p-6 flex items-center justify-center select-none">
          <div className="relative w-[1140px] h-[540px]">
            {/* SVG Streams Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {visibleStreams.map((stream) => {
                const src = nodes.find((n) => n.id === stream.source);
                const tgt = nodes.find((n) => n.id === stream.target);
                if (!src || !tgt) return null;

                const sx = src.x + 80;
                const sy = src.y + 110;
                const tx = tgt.x + 80;
                const ty = tgt.y + 110;

                const isSelected = activeInspectionStream?.id === stream.id;
                const strokeColor = getStreamColor(stream);

                // Compute smooth bezier
                const mx = (sx + tx) / 2;
                const my = (sy + ty) / 2;
                const d = `M ${sx} ${sy} Q ${mx} ${sy}, ${mx} ${my} T ${tx} ${ty}`;

                return (
                  <g key={stream.id} className="cursor-pointer pointer-events-auto">
                    {/* Wider hit-area */}
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={20}
                      onClick={() => setActiveInspectionStream(stream)}
                    />

                    {/* Visible line */}
                    <path
                      d={d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3.5 : 2}
                      strokeDasharray={stream.state === 'planned' ? '6,6' : undefined}
                      className={isSelected ? 'filter drop-shadow-[0_0_8px_#38bdf8]' : ''}
                      onClick={() => setActiveInspectionStream(stream)}
                    />

                    {/* Animated moving packet */}
                    {stream.state !== 'problem' && (
                      <circle r="4" fill={strokeColor}>
                        <animateMotion
                          dur={stream.state === 'modified' ? '1.8s' : '2.8s'}
                          repeatCount="indefinite"
                          path={d}
                        />
                      </circle>
                    )}

                    {/* Protocol tag on line */}
                    <rect
                      x={mx - 24}
                      y={my - 10}
                      width={48}
                      height={18}
                      rx={5}
                      fill="#020617"
                      stroke={strokeColor}
                      strokeWidth={1}
                      onClick={() => setActiveInspectionStream(stream)}
                    />
                    <text
                      x={mx}
                      y={my + 3}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      onClick={() => setActiveInspectionStream(stream)}
                    >
                      {stream.protocol}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Rendered Nodes on Canvas */}
            {visibleNodes.map((node) => {
              const isSelected = node.id === selectedNodeId;
              const hasPii = showPiiLayer && node.piiData;

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  style={{ left: `${node.x}px`, top: `${node.y + 70}px` }}
                  className={`absolute w-36 p-2.5 rounded-xl border cursor-pointer transition-all duration-200 shadow-xl ${
                    hasPii
                      ? 'ring-2 ring-amber-400 bg-amber-950/40 border-amber-500 text-amber-200'
                      : isSelected
                      ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400 text-cyan-200 scale-105'
                      : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="uppercase font-mono tracking-wider">{node.type}</span>
                    {node.isNew && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                        NEW
                      </span>
                    )}
                    {hasPii && <Lock className="w-3 h-3 text-amber-400" />}
                  </div>

                  <h5 className="font-bold text-xs truncate text-white leading-tight">
                    {node.name}
                  </h5>

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="truncate">{node.layer}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Drawer: Stream & Node Inspection Details */}
      {activeInspectionStream && (
        <div className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 p-5 flex flex-col shrink-0 select-none overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-100">Детали потока данных</h4>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                activeInspectionStream.state === 'problem'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}
            >
              {activeInspectionStream.state}
            </span>
          </div>

          {/* Source -> Target banner */}
          <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              {nodes.find((n) => n.id === activeInspectionStream.source)?.name ||
                activeInspectionStream.source}
            </span>
            <div className="flex items-center gap-1 text-cyan-400 font-mono text-[11px]">
              <span>── {activeInspectionStream.protocol} ──▶</span>
            </div>
            <span className="font-semibold text-slate-200">
              {nodes.find((n) => n.id === activeInspectionStream.target)?.name ||
                activeInspectionStream.target}
            </span>
          </div>

          {/* Issue Alert if problem */}
          {activeInspectionStream.issueDescription && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-700/80 text-xs text-rose-200">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Обнаружено узкое место (SLA Breach)</span>
              </div>
              <p className="leading-relaxed">{activeInspectionStream.issueDescription}</p>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">Пропускная способность</span>
              <p className="font-mono font-bold text-cyan-300 mt-0.5">
                {activeInspectionStream.throughput}
              </p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">Задержка (Latency P99)</span>
              <p
                className={`font-mono font-bold mt-0.5 ${
                  activeInspectionStream.state === 'problem' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {activeInspectionStream.latency}
              </p>
            </div>
          </div>

          {/* Metadata & Ownership */}
          <div className="space-y-2.5 text-xs text-slate-300 mb-4">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-slate-400">Владелец / Агент:</span>
              <span className="font-semibold text-slate-100">{activeInspectionStream.owner}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-slate-400">PII / Данные безопасности:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeInspectionStream.piiSensitive
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400'
                }`}
              >
                {activeInspectionStream.piiSensitive ? 'Шифрование + Маскирование' : 'Стандартные'}
              </span>
            </div>
          </div>

          {/* Schema Payload Sample */}
          {activeInspectionStream.schemaSample && (
            <div className="flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                Схема полезной нагрузки (Schema)
              </span>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {activeInspectionStream.schemaSample}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
