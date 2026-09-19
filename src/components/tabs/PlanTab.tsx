import React, { useState, useRef, useMemo } from 'react';
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
  Flame,
  AlertTriangle,
  ArrowRight,
  Route,
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
  const [highlightCriticalPath, setHighlightCriticalPath] = useState<boolean>(true);
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

  // Critical path and dependency analysis based on selectedNodeId
  const {
    blockerNodeIds,
    criticalLinkIds,
    dependentNodeIds,
    selectedNode,
  } = useMemo(() => {
    const selNode = nodes.find((n) => n.id === selectedNodeId);
    if (!selectedNodeId || !selNode) {
      return {
        blockerNodeIds: new Set<string>(),
        criticalLinkIds: new Set<string>(),
        dependentNodeIds: new Set<string>(),
        selectedNode: null,
      };
    }

    const blockers = new Set<string>();
    const criticalLinks = new Set<string>();
    const dependents = new Set<string>();

    // 1. Ancestors / upstream blockers (nodes that this node depends on)
    // Traverse upwards via parentId and incoming links (source -> target = selectedNodeId)
    const queueUp = [selectedNodeId];
    const visitedUp = new Set<string>([selectedNodeId]);

    while (queueUp.length > 0) {
      const curr = queueUp.shift()!;
      const currNode = nodes.find((n) => n.id === curr);

      // Links where target is curr
      links.forEach((l) => {
        if (l.target === curr) {
          criticalLinks.add(l.id);
          if (!visitedUp.has(l.source)) {
            visitedUp.add(l.source);
            blockers.add(l.source);
            queueUp.push(l.source);
          }
        }
      });

      // Parent dependency
      if (currNode?.parentId && !visitedUp.has(currNode.parentId)) {
        visitedUp.add(currNode.parentId);
        blockers.add(currNode.parentId);
        queueUp.push(currNode.parentId);

        // Find link representing parent -> child if exists
        const parentLink = links.find((l) => l.source === currNode.parentId && l.target === curr);
        if (parentLink) {
          criticalLinks.add(parentLink.id);
        }
      }

      // Explicit dependsOn array if present
      if (currNode?.dependsOn) {
        currNode.dependsOn.forEach((depId) => {
          if (!visitedUp.has(depId)) {
            visitedUp.add(depId);
            blockers.add(depId);
            queueUp.push(depId);
          }
        });
      }
    }

    // 2. Descendants / downstream dependents (nodes blocked by this node)
    const queueDown = [selectedNodeId];
    const visitedDown = new Set<string>([selectedNodeId]);

    while (queueDown.length > 0) {
      const curr = queueDown.shift()!;

      links.forEach((l) => {
        if (l.source === curr) {
          if (!visitedDown.has(l.target)) {
            visitedDown.add(l.target);
            dependents.add(l.target);
            queueDown.push(l.target);
          }
        }
      });

      // Children by parentId
      nodes.filter((n) => n.parentId === curr).forEach((child) => {
        if (!visitedDown.has(child.id)) {
          visitedDown.add(child.id);
          dependents.add(child.id);
          queueDown.push(child.id);
        }
      });
    }

    return {
      blockerNodeIds: blockers,
      criticalLinkIds: criticalLinks,
      dependentNodeIds: dependents,
      selectedNode: selNode,
    };
  }, [nodes, links, selectedNodeId]);

  // Count uncompleted blocking tasks
  const uncompletedBlockers = useMemo(() => {
    return Array.from(blockerNodeIds)
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is MindmapNode => !!n && n.status !== 'completed' && n.id !== 'root');
  }, [blockerNodeIds, nodes]);

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

        {/* Toggle Critical Path highlight */}
        <div className="flex items-center border-r border-slate-800 pr-2 mr-1">
          <button
            id="toggle-critical-path-btn"
            onClick={() => setHighlightCriticalPath((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              highlightCriticalPath
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Подсвечивать цепочку предшествующих блокирующих задач для выбранного узла"
          >
            <Flame className={`w-3.5 h-3.5 ${highlightCriticalPath ? 'text-amber-400 fill-amber-400/30' : 'text-slate-400'}`} />
            <span>Критический путь</span>
            {highlightCriticalPath && blockerNodeIds.size > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {blockerNodeIds.size}
              </span>
            )}
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

      {/* Critical Path Floating HUD Banner */}
      {highlightCriticalPath && selectedNode && (
        <div className="absolute top-18 left-4 z-20 max-w-md bg-slate-900/95 backdrop-blur-md rounded-xl border border-amber-500/40 p-3 shadow-2xl text-xs space-y-2 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Route className="w-4 h-4 text-amber-400" />
              <span>Критический путь: <span className="text-white font-mono">{selectedNode.label}</span></span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {selectedNode.progress}%
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Предшественники: <strong>{blockerNodeIds.size}</strong></span>
            </div>
            {uncompletedBlockers.length > 0 ? (
              <div className="flex items-center gap-1 text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Блокируют ({uncompletedBlockers.length}):</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Все блокеры завершены</span>
              </div>
            )}
          </div>

          {uncompletedBlockers.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5 max-h-20 overflow-y-auto">
              {uncompletedBlockers.map((blocker) => (
                <button
                  key={blocker.id}
                  onClick={() => onSelectNode(blocker.id)}
                  className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Нажмите, чтобы сфокусироваться на этой блокирующей задаче"
                >
                  <span>⚠️ {blocker.label}</span>
                  <span className="font-mono text-[9px] opacity-80">({blocker.progress}%)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
            {/* Standard link active */}
            <linearGradient id="linkGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.9" />
            </linearGradient>

            {/* Critical path glowing gradient */}
            <linearGradient id="linkGradCritical" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="linkGradNormal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.7" />
            </linearGradient>

            <filter id="glowCritical" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {links.map((link) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);
            if (!sourceNode || !targetNode) return null;

            const isSourceSelected = sourceNode.id === selectedNodeId;
            const isTargetSelected = targetNode.id === selectedNodeId;
            const isCriticalLink = highlightCriticalPath && criticalLinkIds.has(link.id);
            const isHighlighted = isSourceSelected || isTargetSelected || link.isPulsing || isCriticalLink;

            // Compute bezier curve
            const sx = sourceNode.x + 100;
            const sy = sourceNode.y + 40;
            const tx = targetNode.x + 100;
            const ty = targetNode.y + 40;
            const mx = (sx + tx) / 2;

            const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;

            let strokeColor = 'url(#linkGradNormal)';
            if (isCriticalLink) {
              strokeColor = 'url(#linkGradCritical)';
            } else if (isHighlighted) {
              strokeColor = 'url(#linkGradActive)';
            }

            return (
              <g key={link.id}>
                {/* Background glow for critical path */}
                {isCriticalLink && (
                  <path
                    d={d}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={7}
                    strokeOpacity={0.35}
                    filter="url(#glowCritical)"
                  />
                )}

                {/* Primary path */}
                <path
                  d={d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isCriticalLink ? 3.5 : isHighlighted ? 3 : 2}
                  strokeDasharray={isCriticalLink ? '8,4' : link.isPulsing ? '6,6' : undefined}
                  className={isCriticalLink || link.isPulsing ? 'animate-dash' : ''}
                />

                {/* Animated pulse packet traveling along path */}
                {(isCriticalLink || link.isPulsing) && (
                  <circle
                    r={isCriticalLink ? '4.5' : '4'}
                    fill={isCriticalLink ? '#fbbf24' : '#38bdf8'}
                    className={`filter ${
                      isCriticalLink
                        ? 'drop-shadow-[0_0_8px_#f59e0b]'
                        : 'drop-shadow-[0_0_6px_#38bdf8]'
                    }`}
                  >
                    <animateMotion
                      dur={isCriticalLink ? '1.6s' : '2.4s'}
                      repeatCount="indefinite"
                      path={d}
                    />
                  </circle>
                )}

                {/* Connection Label if any */}
                {link.label && (
                  <text
                    x={mx}
                    y={(sy + ty) / 2 - 8}
                    textAnchor="middle"
                    fill={isCriticalLink ? '#fbbf24' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={isCriticalLink ? 'bold' : 'normal'}
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
            const isBlocker = highlightCriticalPath && blockerNodeIds.has(node.id);
            const isDependent = highlightCriticalPath && dependentNodeIds.has(node.id);
            const isUncompletedBlocker = isBlocker && node.status !== 'completed' && !isRoot;

            // Determine styling classes based on critical path position
            let ringAndBorder = '';
            let glowBadge = null;

            if (isSelected) {
              ringAndBorder = 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-105 shadow-cyan-500/20 bg-slate-900 border-cyan-400';
            } else if (isUncompletedBlocker) {
              ringAndBorder = 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-950 scale-102 border-rose-500 bg-gradient-to-br from-rose-950/80 to-slate-900 shadow-rose-900/40';
              glowBadge = (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white shadow-sm flex items-center gap-0.5 animate-pulse">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  БЛОКИРУЕТ
                </span>
              );
            } else if (isBlocker) {
              ringAndBorder = 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 border-amber-400 bg-gradient-to-br from-amber-950/70 to-slate-900 shadow-amber-900/30';
              glowBadge = (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/90 text-slate-950 shadow-sm flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5" />
                  ПРЕДШЕСТВЕННИК
                </span>
              );
            } else if (isDependent) {
              ringAndBorder = 'border-indigo-500/80 bg-gradient-to-br from-indigo-950/60 to-slate-900';
            } else {
              ringAndBorder = `bg-gradient-to-br ${getCategoryColor(node.category)} hover:border-slate-400 hover:scale-[1.02]`;
            }

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
                className={`absolute pointer-events-auto rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-lg ${ringAndBorder}`}
              >
                {/* Header: Category icon & Status */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold truncate">
                    {getCategoryIcon(node.category)}
                    <span className="truncate">{node.category.toUpperCase()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {glowBadge}
                    {!glowBadge && node.isNew && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                        🆕 NEW
                      </span>
                    )}
                    {node.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className={`text-[10px] font-mono font-bold ${isUncompletedBlocker ? 'text-rose-400' : 'text-cyan-300'}`}>
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
                        : isUncompletedBlocker
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : isBlocker
                        ? 'bg-amber-400'
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

