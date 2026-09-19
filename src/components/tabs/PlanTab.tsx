import React, { useState, useRef } from 'react';
import {
  MindmapNode,
  MindmapLink,
} from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Bot,
  CheckCircle2,
  Layers,
  Shield,
  Server,
  Cpu,
  RefreshCw,
  GitBranch,
} from 'lucide-react';

interface PlanTabProps {
  nodes: MindmapNode[];
  links: MindmapLink[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodeProgress?: (nodeId: string, progress: number) => void;
}

export const PlanTab: React.FC<PlanTabProps> = ({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 50, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(1.8, Math.max(0.5, prev + delta)));
  };

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 80, y: 120 });
  };

  const filteredNodes = nodes.filter((n) => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'stack':
        return 'from-cyan-900/60 to-slate-900 border-cyan-500/60 text-cyan-300';
      case 'infra':
        return 'from-amber-900/60 to-slate-900 border-amber-500/60 text-amber-300';
      case 'ui':
        return 'from-indigo-900/60 to-slate-900 border-indigo-500/60 text-indigo-300';
      case 'security':
        return 'from-emerald-900/60 to-slate-900 border-emerald-500/60 text-emerald-300';
      default:
        return 'from-slate-850 to-slate-900 border-slate-700 text-slate-300';
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'stack':
        return <Layers className="w-3.5 h-3.5" />;
      case 'infra':
        return <Server className="w-3.5 h-3.5" />;
      case 'ui':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={{
        backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl text-xs">
        <div className="flex items-center gap-1 border-r border-slate-800 pr-2 mr-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCategory === 'all'
                ? 'bg-cyan-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Все ветки
          </button>
          <button
            onClick={() => setFilterCategory('stack')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCategory === 'stack'
                ? 'bg-cyan-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🧩 Стек
          </button>
          <button
            onClick={() => setFilterCategory('infra')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCategory === 'infra'
                ? 'bg-amber-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏗️ Инфра
          </button>
          <button
            onClick={() => setFilterCategory('ui')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCategory === 'ui'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🖼️ UI
          </button>
          <button
            onClick={() => setFilterCategory('security')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              filterCategory === 'security'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔐 Безопасность
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Приблизить"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Отдалить"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Сбросить вид"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


      {/* Scalable & Pannable Mindmap Canvas */}
      <div
        className="absolute inset-0 transform-gpu origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Curved Connections */}
        <svg
          className="absolute inset-0 w-[2400px] h-[1600px] pointer-events-none overflow-visible"
        >
          <defs>
            <linearGradient id="linkGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="linkGradNormal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {links.map((link) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const isSourceSelected = sourceNode.id === selectedNodeId;
            const isTargetSelected = targetNode.id === selectedNodeId;
            const isHighlighted = isSourceSelected || isTargetSelected || link.isPulsing;

            // Compute bezier curve
            const sx = sourceNode.x + 100;
            const sy = sourceNode.y + 40;
            const tx = targetNode.x + 100;
            const ty = targetNode.y + 40;
            const mx = (sx + tx) / 2;

            const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;

            return (
              <g key={link.id}>
                {/* Background path */}
                <path
                  d={d}
                  fill="none"
                  stroke={isHighlighted ? 'url(#linkGradActive)' : 'url(#linkGradNormal)'}
                  strokeWidth={isHighlighted ? 3 : 2}
                  strokeDasharray={link.isPulsing ? '6,6' : undefined}
                  className={link.isPulsing ? 'animate-dash' : ''}
                />

                {/* Animated pulse packet traveling along path */}
                {link.isPulsing && (
                  <circle r="4" fill="#38bdf8" className="filter drop-shadow-[0_0_6px_#38bdf8]">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={d} />
                  </circle>
                )}

                {/* Connection Label if any */}
                {link.label && (
                  <text
                    x={mx}
                    y={(sy + ty) / 2 - 8}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    className="bg-slate-900"
                  >
                    {link.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes layer */}
        <div className="absolute inset-0 w-[2400px] h-[1600px] pointer-events-none">
          {filteredNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isRoot = node.id === 'root';

            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: isRoot ? '240px' : '220px',
                }}
                className={`absolute pointer-events-auto rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-cyan-500/20 bg-slate-900 border-cyan-400'
                    : `bg-gradient-to-br ${getCategoryColor(
                        node.category
                      )} hover:border-slate-400 hover:scale-[1.02]`
                }`}
              >
                {/* Header: Category icon & Status */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold truncate">
                    {getCategoryIcon(node.category)}
                    <span className="truncate">{node.category.toUpperCase()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {node.isNew && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                        🆕 NEW
                      </span>
                    )}
                    {node.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-300 font-bold">
                        {node.progress}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Node Title */}
                <h4 className="text-xs font-bold text-white leading-tight mb-1 truncate">
                  {node.label}
                </h4>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-1.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      node.status === 'completed'
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>

                {/* Active Agent Badge if assigned */}
                {node.agent && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-cyan-300 font-medium truncate">
                      <Bot className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{node.agent}</span>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
