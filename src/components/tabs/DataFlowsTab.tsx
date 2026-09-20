import React, { useState, useRef, useEffect } from 'react';
import { DataFlowNode, DataFlowStream } from '../../types';
import { NodeLoadInspector } from './NodeLoadInspector';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Zap,
  RotateCcw,
  ArrowRight,
  Gauge,
  Sliders,
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
  nodes: initialNodes,
  streams,
  selectedStreamId,
  onSelectStream,
  selectedNodeId,
  onSelectNode,
}) => {
  // Layer visibility toggles
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    services: true,
    db: true,
    queues: true,
    external: true,
  });

  const [showPiiLayer, setShowPiiLayer] = useState(false);
  const [diffMode, setDiffMode] = useState<'after' | 'current'>('after');

  // Inspector Mode: 'node' (view load metrics) or 'stream' (view protocol / schema)
  const [inspectorMode, setInspectorMode] = useState<'node' | 'stream'>('node');

  // Active stream inspected
  const [activeInspectionStream, setActiveInspectionStream] = useState<DataFlowStream | null>(() => {
    if (selectedStreamId) {
      return streams.find((s) => s.id === selectedStreamId) || null;
    }
    return streams.find((s) => s.state === 'problem') || streams[0] || null;
  });

  // Local mutable positions for interactive node dragging
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    initialNodes.forEach((n) => {
      pos[n.id] = { x: n.x, y: n.y };
    });
    return pos;
  });

  // Interactive Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Hovered node to highlight connected paths
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Global load spike simulation
  const [isSpikeActive, setIsSpikeActive] = useState(false);

  // Sync if initialNodes change
  useEffect(() => {
    setNodePositions((prev) => {
      const next = { ...prev };
      initialNodes.forEach((n) => {
        if (!next[n.id]) {
          next[n.id] = { x: n.x, y: n.y };
        }
      });
      return next;
    });
  }, [initialNodes]);

  // Sync selected stream from props
  useEffect(() => {
    if (selectedStreamId) {
      const found = streams.find((s) => s.id === selectedStreamId);
      if (found) {
        setActiveInspectionStream(found);
      }
    }
  }, [selectedStreamId, streams]);

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const resetTopology = () => {
    const pos: Record<string, { x: number; y: number }> = {};
    initialNodes.forEach((n) => {
      pos[n.id] = { x: n.x, y: n.y };
    });
    setNodePositions(pos);
    setZoom(1);
    setPan({ x: 30, y: 30 });
  };

  const getStreamColor = (stream: DataFlowStream) => {
    if (showPiiLayer && stream.piiSensitive) return '#f59e0b'; // Gold for PII
    switch (stream.state) {
      case 'problem':
        return '#f43f5e'; // Rose
      case 'modified':
        return '#eab308'; // Amber
      case 'planned':
        return '#94a3b8'; // Slate
      case 'active':
      default:
        return '#06b6d4'; // Cyan
    }
  };

  // Node Click handler -> switch inspector to node load
  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectNode(nodeId);
    setInspectorMode('node');
  };

  // Stream Click handler -> switch inspector to stream details
  const handleStreamClick = (stream: DataFlowStream, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveInspectionStream(stream);
    onSelectStream?.(stream.id);
    setInspectorMode('stream');
  };

  // Mouse handlers for canvas panning
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    } else if (draggingNodeId) {
      const newX = Math.round((e.clientX - dragOffsetRef.current.x) / zoom);
      const newY = Math.round((e.clientY - dragOffsetRef.current.y) / zoom);
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node Drag handlers
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    const pos = nodePositions[nodeId] ?? { x: 0, y: 0 };
    dragOffsetRef.current = {
      x: e.clientX - pos.x * zoom,
      y: e.clientY - pos.y * zoom,
    };
  };

  // Active inspected node object
  const activeInspectedNode = initialNodes.find((n) => n.id === selectedNodeId) || initialNodes[0];

  const visibleNodes = initialNodes.filter((n) => activeLayers[n.layer]);
  const visibleStreams = streams.filter((s) => {
    if (diffMode === 'current' && s.isNew) return false;
    const src = initialNodes.find((n) => n.id === s.source);
    const tgt = initialNodes.find((n) => n.id === s.target);
    return src && tgt && activeLayers[src.layer] && activeLayers[tgt.layer];
  });

  // Calculate connected streams to highlighted node
  const activeFocusNodeId = hoveredNodeId || selectedNodeId;

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden relative select-none">
      {/* Main Flow Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Top Control Bar: Layer Toggles & Filters */}
        <div className="h-14 px-4 lg:px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-1">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">
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

          {/* Right Tools: PII Layer toggle, Diff & Stress Test */}
          <div className="flex items-center gap-2 text-xs">
            {/* Stress Test Toggle */}
            <button
              onClick={() => setIsSpikeActive(!isSpikeActive)}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all font-semibold ${
                isSpikeActive
                  ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50 animate-pulse'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-amber-300'
              }`}
              title="Симулировать нагрузочный всплеск на графе"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSpikeActive ? 'Тест: +240% RPS' : 'Тест нагрузки'}</span>
            </button>

            <button
              onClick={() => setShowPiiLayer(!showPiiLayer)}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                showPiiLayer
                  ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-900/30'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showPiiLayer ? 'PII: ВКЛ' : '🔐 PII'}</span>
            </button>

            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setDiffMode('current')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  diffMode === 'current' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Сейчас
              </button>
              <button
                onClick={() => setDiffMode('after')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  diffMode === 'after' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                После 🆕
              </button>
            </div>
          </div>
        </div>

        {/* Legend Bar with Interactive Guidance & Zoom Toolbar */}
        <div className="px-4 lg:px-6 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>🔵 активный</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>🟡 изменён</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 font-medium">🔴 узкое место</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>⚪ запланирован</span>
            </div>
          </div>

          {/* Zoom and Pan Controls */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Уменьшить масштаб"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-cyan-300 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Увеличить масштаб"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-3 w-px bg-slate-800 mx-1" />
            <button
              onClick={resetTopology}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
              title="Сбросить масштаб и положение"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[10px]">Сброс</span>
            </button>
          </div>
        </div>

        {/* Canvas Area with Interactive Graph */}
        <div
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className={`flex-1 relative overflow-hidden bg-slate-950 cursor-grab ${
            isPanning ? 'cursor-grabbing' : ''
          }`}
        >
          {/* Subtle Background Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`,
            }}
          />

          {/* Interactive Transform Container */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            <div className="relative w-[1280px] h-[650px] pointer-events-auto">
              {/* SVG Streams Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <defs>
                  {/* Arrow Markers for directional flow */}
                  <marker
                    id="arrow-cyan"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
                  </marker>
                  <marker
                    id="arrow-rose"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                  </marker>
                  <marker
                    id="arrow-amber"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#eab308" />
                  </marker>
                  <marker
                    id="arrow-slate"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
                  </marker>

                  <filter id="stream-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {visibleStreams.map((stream) => {
                  const srcPos = nodePositions[stream.source];
                  const tgtPos = nodePositions[stream.target];
                  if (!srcPos || !tgtPos) return null;

                  // Node card center offsets
                  const sx = srcPos.x + 85;
                  const sy = srcPos.y + 115;
                  const tx = tgtPos.x + 85;
                  const ty = tgtPos.y + 115;

                  const isSelected = activeInspectionStream?.id === stream.id;
                  const isConnectedToFocus =
                    stream.source === activeFocusNodeId || stream.target === activeFocusNodeId;
                  const strokeColor = getStreamColor(stream);

                  // Compute smooth S-curve cubic Bézier
                  const dx = tx - sx;
                  const dy = ty - sy;
                  const cx1 = sx + dx * 0.5;
                  const cy1 = sy;
                  const cx2 = sx + dx * 0.5;
                  const cy2 = ty;
                  const d = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

                  // Midpoint for protocol label
                  const mx = (sx + tx) / 2;
                  const my = (sy + ty) / 2;

                  const markerId =
                    strokeColor === '#f43f5e'
                      ? 'url(#arrow-rose)'
                      : strokeColor === '#eab308' || strokeColor === '#f59e0b'
                      ? 'url(#arrow-amber)'
                      : strokeColor === '#94a3b8'
                      ? 'url(#arrow-slate)'
                      : 'url(#arrow-cyan)';

                  const packetDuration = isSpikeActive
                    ? stream.state === 'modified'
                      ? '0.9s'
                      : '1.2s'
                    : stream.state === 'modified'
                    ? '1.8s'
                    : '2.8s';

                  return (
                    <g
                      key={stream.id}
                      className="cursor-pointer pointer-events-auto transition-opacity duration-200"
                      opacity={activeFocusNodeId && !isConnectedToFocus ? 0.35 : 1}
                    >
                      {/* Wider Hit-area for effortless clicking */}
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={24}
                        onClick={(e) => handleStreamClick(stream, e)}
                      />

                      {/* Visible Bézier Stream Line */}
                      <path
                        d={d}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isSelected ? 4 : isConnectedToFocus ? 3 : 2}
                        strokeDasharray={stream.state === 'planned' ? '6,6' : undefined}
                        markerEnd={markerId}
                        className={
                          isSelected || isConnectedToFocus
                            ? 'filter drop-shadow-[0_0_8px_currentColor]'
                            : ''
                        }
                        onClick={(e) => handleStreamClick(stream, e)}
                      />

                      {/* Moving glowing data packet */}
                      {stream.state !== 'problem' && (
                        <circle r={isSpikeActive ? 5 : 4} fill={strokeColor} className="animate-pulse">
                          <animateMotion dur={packetDuration} repeatCount="indefinite" path={d} />
                        </circle>
                      )}

                      {/* Second packet if load spike active */}
                      {isSpikeActive && stream.state !== 'problem' && (
                        <circle r="3" fill="#ffffff" opacity="0.9">
                          <animateMotion dur={packetDuration} begin="0.5s" repeatCount="indefinite" path={d} />
                        </circle>
                      )}

                      {/* Protocol and Throughput Badge on link midpoint */}
                      <g
                        transform={`translate(${mx}, ${my})`}
                        onClick={(e) => handleStreamClick(stream, e)}
                        className="hover:scale-110 transition-transform"
                      >
                        <rect
                          x={-34}
                          y={-12}
                          width={68}
                          height={24}
                          rx={6}
                          fill="#020617"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 1.8 : 1}
                        />
                        <text
                          x={0}
                          y={-1}
                          textAnchor="middle"
                          fill={strokeColor}
                          fontSize="9.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {stream.protocol}
                        </text>
                        <text
                          x={0}
                          y={8}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="7.5"
                          fontFamily="sans-serif"
                        >
                          {stream.throughput}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Rendered Interactive Nodes on Canvas */}
              {visibleNodes.map((node) => {
                const pos = nodePositions[node.id] ?? { x: node.x, y: node.y };
                const isSelected = node.id === selectedNodeId;
                const isHovered = node.id === hoveredNodeId;
                const hasPii = showPiiLayer && node.piiData;
                const metrics = node.metrics;

                // Mini metrics computation
                const nodeRps = isSpikeActive && metrics ? Math.round(metrics.rps * 2.4) : metrics?.rps;
                const nodeCpu = isSpikeActive && metrics ? Math.min(98, Math.round(metrics.cpuPercent * 1.6 + 15)) : metrics?.cpuPercent;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    onClick={(e) => handleNodeClick(node.id, e)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y + 70}px`,
                    }}
                    className={`absolute w-44 p-3 rounded-xl border cursor-pointer select-none transition-all duration-150 shadow-2xl ${
                      hasPii
                        ? 'ring-2 ring-amber-400 bg-amber-950/60 border-amber-500 text-amber-200'
                        : isSelected
                        ? 'ring-2 ring-cyan-400 bg-slate-900 border-cyan-400 text-cyan-100 shadow-cyan-900/50 scale-[1.03] z-20'
                        : isHovered
                        ? 'ring-1 ring-cyan-500 bg-slate-900/95 border-slate-600 text-white z-10'
                        : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {/* Header: Type, Status light, Badges */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="uppercase font-mono tracking-wider text-[9px] font-semibold text-slate-300">
                          {node.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {node.isNew && (
                          <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                            NEW
                          </span>
                        )}
                        {hasPii && <Lock className="w-3 h-3 text-amber-400" />}
                      </div>
                    </div>

                    {/* Node Title */}
                    <h5 className="font-bold text-xs truncate text-white leading-snug">
                      {node.name}
                    </h5>

                    {/* Live Load Badges on Node Card */}
                    {metrics && (
                      <div className="mt-2 pt-2 border-t border-slate-800/90 space-y-1.5 text-[10px]">
                        {/* RPS & Latency Bar */}
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-cyan-300 font-bold flex items-center gap-0.5">
                            <Activity className="w-2.5 h-2.5 text-cyan-400" />
                            {nodeRps} req/s
                          </span>
                          <span className="text-slate-400">
                            {metrics.p95LatencyMs} ms
                          </span>
                        </div>

                        {/* CPU mini progress meter */}
                        <div>
                          <div className="flex justify-between text-[9px] text-slate-400 mb-0.5 font-mono">
                            <span>CPU</span>
                            <span
                              className={
                                (nodeCpu ?? 0) > 75
                                  ? 'text-rose-400 font-bold'
                                  : (nodeCpu ?? 0) > 55
                                  ? 'text-amber-400 font-bold'
                                  : 'text-emerald-400 font-semibold'
                              }
                            >
                              {nodeCpu}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-200 ${
                                (nodeCpu ?? 0) > 75
                                  ? 'bg-rose-500'
                                  : (nodeCpu ?? 0) > 55
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, nodeCpu ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hint overlay on hover */}
                    <div className="mt-1.5 pt-1 text-[9px] text-slate-500 flex items-center justify-between border-t border-slate-800/40">
                      <span className="truncate">{node.layer}</span>
                      <span className="text-cyan-400 text-[8px]">нажмите для инфо ▶</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Floating Status Chip */}
          <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/90 border border-slate-800 backdrop-blur rounded-xl px-3 py-2 text-xs flex items-center gap-3 shadow-lg">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">
                Узлов: <strong className="text-white font-mono">{visibleNodes.length}</strong> · Потоков:{' '}
                <strong className="text-white font-mono">{visibleStreams.length}</strong>
              </span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Перетаскивайте узлы · Кликните на узел для метрик нагрузки
            </span>
          </div>
        </div>
      </div>

      {/* Right Drawer: Toggle between Node Load Details & Stream Details */}
      {inspectorMode === 'node' && activeInspectedNode ? (
        <NodeLoadInspector
          node={activeInspectedNode}
          streams={streams}
          allNodes={initialNodes}
          onSelectStream={(streamId) => {
            const str = streams.find((s) => s.id === streamId);
            if (str) {
              setActiveInspectionStream(str);
              onSelectStream?.(str.id);
              setInspectorMode('stream');
            }
          }}
          isSpikeActive={isSpikeActive}
          onToggleSpike={() => setIsSpikeActive(!isSpikeActive)}
          onClose={() => {
            if (activeInspectionStream) {
              setInspectorMode('stream');
            }
          }}
        />
      ) : activeInspectionStream ? (
        <div className="w-80 lg:w-[410px] bg-slate-900 border-l border-slate-800 p-5 flex flex-col shrink-0 select-none overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-slate-100">Детали потока данных</h4>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  activeInspectionStream.state === 'problem'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}
              >
                {activeInspectionStream.state}
              </span>

              {activeInspectedNode && (
                <button
                  onClick={() => setInspectorMode('node')}
                  className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                  title="Перейти к метрикам узла"
                >
                  Метрики узла
                </button>
              )}
            </div>
          </div>

          {/* Source -> Target banner */}
          <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                onSelectNode(activeInspectionStream.source);
                setInspectorMode('node');
              }}
              className="font-semibold text-cyan-300 hover:underline truncate max-w-[110px] text-left"
              title="Открыть метрики узла-источника"
            >
              {initialNodes.find((n) => n.id === activeInspectionStream.source)?.name ||
                activeInspectionStream.source}
            </button>

            <div className="flex items-center gap-1 text-cyan-400 font-mono text-[11px] shrink-0 mx-2">
              <span>── {activeInspectionStream.protocol} ──▶</span>
            </div>

            <button
              onClick={() => {
                onSelectNode(activeInspectionStream.target);
                setInspectorMode('node');
              }}
              className="font-semibold text-cyan-300 hover:underline truncate max-w-[110px] text-right"
              title="Открыть метрики узла-получателя"
            >
              {initialNodes.find((n) => n.id === activeInspectionStream.target)?.name ||
                activeInspectionStream.target}
            </button>
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
      ) : null}
    </div>
  );
};
