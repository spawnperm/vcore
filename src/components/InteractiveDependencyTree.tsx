import React, { useState, useMemo } from 'react';
import {
  MindmapNode,
  MindmapLink,
  NodeStatus,
} from '../types';
import {
  GripVertical,
  ChevronRight,
  ChevronDown,
  Layers,
  Server,
  Cpu,
  Shield,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  RotateCcw,
  Sparkles,
  ListOrdered,
  Network,
  CornerDownRight,
  ArrowRight,
  Bot,
  Info,
  X,
  Plus,
} from 'lucide-react';

interface InteractiveDependencyTreeProps {
  nodes: MindmapNode[];
  links: MindmapLink[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onReorganizePlan: (newNodes: MindmapNode[], newLinks: MindmapLink[], changeDescription?: string) => void;
  onResetToDefault?: () => void;
}

type DropPosition = 'before' | 'inside' | 'after';

interface TreeNode extends MindmapNode {
  children: TreeNode[];
  level: number;
  stepNumber: string;
  crossDependencies: string[];
}

export const InteractiveDependencyTree: React.FC<InteractiveDependencyTreeProps> = ({
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
  onReorganizePlan,
  onResetToDefault,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'pipeline'>('tree');
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Record<string, boolean>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  // Helper to show temporary notification
  const showNotice = (text: string, type: 'success' | 'warn' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4000);
  };

  // Toggle expand / collapse of a node branch
  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollapsedNodeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedNodeIds({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    nodes.forEach((n) => {
      all[n.id] = true;
    });
    setCollapsedNodeIds(all);
  };

  // Find all descendants of a node to avoid circular dependency
  const getDescendantIds = (nodeId: string): Set<string> => {
    const descendants = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      nodes
        .filter((n) => n.parentId === current)
        .forEach((child) => {
          descendants.add(child.id);
          stack.push(child.id);
        });
    }
    return descendants;
  };

  // Build hierarchical tree structure with execution step numbers
  const treeData = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();

    // Initial mapping
    nodes.forEach((n) => {
      // Find cross-dependencies from links (incoming links that are not parent-child)
      const incomingLinks = links
        .filter((l) => l.target === n.id && l.source !== n.parentId)
        .map((l) => {
          const src = nodes.find((s) => s.id === l.source);
          return src ? src.label : l.source;
        });

      nodeMap.set(n.id, {
        ...n,
        children: [],
        level: 0,
        stepNumber: '',
        crossDependencies: incomingLinks,
      });
    });

    const roots: TreeNode[] = [];

    // Group into hierarchy
    nodes.forEach((n) => {
      const treeNode = nodeMap.get(n.id)!;
      if (n.parentId && nodeMap.has(n.parentId) && n.parentId !== n.id) {
        nodeMap.get(n.parentId)!.children.push(treeNode);
      } else {
        roots.push(treeNode);
      }
    });

    // Assign level and execution step numbering
    const assignMetadata = (items: TreeNode[], parentStep: string, level: number) => {
      items.forEach((item, index) => {
        item.level = level;
        item.stepNumber = parentStep ? `${parentStep}.${index + 1}` : `${index + 1}`;
        assignMetadata(item.children, item.stepNumber, level + 1);
      });
    };

    assignMetadata(roots, '', 0);

    return roots;
  }, [nodes, links]);

  // Linear execution pipeline order (flattened topological order)
  const pipelineData = useMemo(() => {
    const result: TreeNode[] = [];
    const traverse = (items: TreeNode[]) => {
      items.forEach((item) => {
        result.push(item);
        traverse(item.children);
      });
    };
    traverse(treeData);
    return result;
  }, [treeData]);

  // Category styling helper
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'stack':
        return {
          icon: <Layers className="w-3 h-3 text-cyan-400" />,
          bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
          label: 'Стек',
        };
      case 'infra':
        return {
          icon: <Server className="w-3 h-3 text-amber-400" />,
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          label: 'Инфра',
        };
      case 'ui':
        return {
          icon: <Cpu className="w-3 h-3 text-indigo-400" />,
          bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80',
          label: 'UI',
        };
      case 'security':
        return {
          icon: <Shield className="w-3 h-3 text-emerald-400" />,
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
          label: 'SecOps',
        };
      default:
        return {
          icon: <Sparkles className="w-3 h-3 text-slate-400" />,
          bg: 'bg-slate-850 text-slate-300 border-slate-700',
          label: 'Общий',
        };
    }
  };

  // Status badge helper
  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'in_progress':
        return <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  // Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNodeId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetId) return;

    // Check circular dependency
    const descendants = getDescendantIds(draggedNodeId);
    if (descendants.has(targetId)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    // Determine drop position: top 25% -> before, middle 50% -> inside (as child), bottom 25% -> after
    let pos: DropPosition = 'inside';
    if (offsetY < height * 0.28) {
      pos = 'before';
    } else if (offsetY > height * 0.72) {
      pos = 'after';
    } else {
      pos = 'inside';
    }

    if (dropTargetId !== targetId || dropPosition !== pos) {
      setDropTargetId(targetId);
      setDropPosition(pos);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if left the actual container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = draggedNodeId || e.dataTransfer.getData('text/plain');
    const pos = dropPosition || 'inside';

    setDraggedNodeId(null);
    setDropTargetId(null);
    setDropPosition(null);

    if (!sourceId || sourceId === targetId) return;

    // Check circular dependency prevention
    const descendants = getDescendantIds(sourceId);
    if (descendants.has(targetId)) {
      showNotice('Нельзя перетащить узел в его собственного потомка (циклическая зависимость)', 'warn');
      return;
    }

    const sourceNode = nodes.find((n) => n.id === sourceId);
    const targetNode = nodes.find((n) => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    // Execute reorganization
    const newNodes = [...nodes];
    const sourceIndex = newNodes.findIndex((n) => n.id === sourceId);
    const [removedNode] = newNodes.splice(sourceIndex, 1);

    let newParentId: string | undefined = undefined;
    let description = '';

    if (pos === 'inside') {
      // Reparent: sourceNode becomes child of targetNode
      newParentId = targetId;
      removedNode.parentId = newParentId;

      // Adjust mindmap layout coordinates relative to new parent
      removedNode.x = targetNode.x + 200;
      removedNode.y = targetNode.y + (targetNode.parentId ? 60 : 80);

      // Insert immediately after target in the array
      const targetIdx = newNodes.findIndex((n) => n.id === targetId);
      newNodes.splice(targetIdx + 1, 0, removedNode);

      description = `Узел «${sourceNode.label}» теперь зависит от «${targetNode.label}» (сделан дочерним шагом)`;
    } else {
      // Sibling insertion (before or after)
      newParentId = targetNode.parentId;
      removedNode.parentId = newParentId;

      // Calculate new x, y position near target
      removedNode.x = targetNode.x;
      removedNode.y = pos === 'before' ? targetNode.y - 50 : targetNode.y + 50;

      const targetIdx = newNodes.findIndex((n) => n.id === targetId);
      const insertIdx = pos === 'before' ? targetIdx : targetIdx + 1;
      newNodes.splice(insertIdx, 0, removedNode);

      description = `Узел «${sourceNode.label}» перемещён ${pos === 'before' ? 'перед' : 'после'} «${targetNode.label}» в очереди выполнения`;
    }

    // Update links to reflect new parent-child dependency
    let newLinks = links.filter((l) => !(l.target === sourceId && l.source === sourceNode.parentId));
    if (newParentId) {
      newLinks.push({
        id: `link-dep-${Date.now()}`,
        source: newParentId,
        target: sourceId,
        isPulsing: true,
        isNew: true,
        label: 'зависимость',
      });
    }

    onReorganizePlan(newNodes, newLinks, description);
    showNotice(description, 'success');

    // Make sure parent is expanded so user sees the dropped node
    if (newParentId) {
      setCollapsedNodeIds((prev) => ({ ...prev, [newParentId!]: false }));
    }
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDropTargetId(null);
    setDropPosition(null);
  };

  // Quick action: Promote / Outdent node (make root or parent of parent)
  const handlePromoteNode = (node: MindmapNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.parentId) return;

    const parent = nodes.find((n) => n.id === node.parentId);
    const newParentId = parent?.parentId; // parent's parent or undefined (root level)

    const updatedNodes = nodes.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          parentId: newParentId,
          x: Math.max(100, n.x - 150),
        };
      }
      return n;
    });

    let updatedLinks = links.filter((l) => !(l.target === node.id && l.source === node.parentId));
    if (newParentId) {
      updatedLinks.push({
        id: `link-prom-${Date.now()}`,
        source: newParentId,
        target: node.id,
        isPulsing: true,
        isNew: true,
      });
    }

    const desc = `Уровень шага «${node.label}» повышен (перемещён выше в дереве зависимостей)`;
    onReorganizePlan(updatedNodes, updatedLinks, desc);
    showNotice(desc, 'success');
  };

  // Filter check
  const matchesFilter = (item: TreeNode): boolean => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    const selfMatches =
      item.label.toLowerCase().includes(q) ||
      (item.agent && item.agent.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));
    const childMatches = item.children.some((child) => matchesFilter(child));
    return selfMatches || childMatches;
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode) => {
    if (!matchesFilter(node)) return null;

    const isSelected = node.id === selectedNodeId;
    const isCollapsed = !!collapsedNodeIds[node.id];
    const hasChildren = node.children.length > 0;
    const isDraggingThis = draggedNodeId === node.id;
    const isTarget = dropTargetId === node.id;
    const catBadge = getCategoryBadge(node.category);

    return (
      <div key={node.id} className="relative select-none">
        {/* Drop indicator: Top line */}
        {isTarget && dropPosition === 'before' && (
          <div className="absolute -top-1 left-2 right-2 h-1 bg-cyan-400 rounded-full z-30 shadow-[0_0_8px_rgba(6,182,212,0.8)] flex items-center justify-between">
            <span className="w-2 h-2 rounded-full bg-cyan-300 -ml-1" />
            <span className="text-[9px] font-mono font-bold text-cyan-300 bg-slate-900 px-1 rounded border border-cyan-800">
              Вставить перед
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-300 -mr-1" />
          </div>
        )}

        {/* Node Item Container */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelectNode(node.id)}
          className={`group relative flex items-center justify-between py-1.5 px-2 my-0.5 rounded-lg border text-xs cursor-pointer transition-all ${
            isDraggingThis
              ? 'opacity-30 border-dashed border-cyan-500 bg-cyan-950/20'
              : isSelected
              ? 'bg-cyan-950/90 text-cyan-200 border-cyan-600/80 shadow-sm shadow-cyan-900/30'
              : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
          } ${
            isTarget && dropPosition === 'inside'
              ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/60 scale-[1.01]'
              : ''
          }`}
          style={{
            paddingLeft: `${Math.max(8, node.level * 16 + 8)}px`,
          }}
        >
          {/* Left Side: Drag Handle + Expand Toggle + Step # + Icon + Label */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Drag Handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-cyan-400 p-0.5 -ml-1 rounded transition-colors"
              title="Перетащите для реорганизации логики выполнения"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Expand / Collapse Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                title={isCollapsed ? 'Развернуть подзадачи' : 'Свернуть подзадачи'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
              </span>
            )}

            {/* Step Number Badge */}
            <span
              className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0"
              title={`Очерёдность выполнения: Шаг ${node.stepNumber}`}
            >
              №{node.stepNumber}
            </span>

            {/* Status icon */}
            {getStatusIcon(node.status)}

            {/* Label */}
            <span
              className={`font-medium truncate ${
                isSelected ? 'text-cyan-100 font-semibold' : 'text-slate-200'
              }`}
            >
              {node.label}
            </span>

            {/* New Badge */}
            {node.isNew && (
              <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 shrink-0">
                NEW
              </span>
            )}
          </div>

          {/* Right Side: Category pill + Progress + Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Cross-dependencies hint */}
            {node.crossDependencies.length > 0 && (
              <span
                className="hidden lg:flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                title={`Доп. зависимости: ${node.crossDependencies.join(', ')}`}
              >
                <CornerDownRight className="w-2.5 h-2.5 text-cyan-400" />
                <span>{node.crossDependencies.length}</span>
              </span>
            )}

            {/* Progress Badge */}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                node.progress === 100
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-950 text-cyan-300 border-slate-800'
              }`}
            >
              {node.progress}%
            </span>

            {/* Quick promote / unparent button on hover */}
            {node.parentId && (
              <button
                type="button"
                onClick={(e) => handlePromoteNode(node, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-opacity"
                title="Повысить уровень (сделать выше в дереве зависимостей)"
              >
                <ArrowRight className="w-3 h-3 rotate-180" />
              </button>
            )}
          </div>
        </div>

        {/* Drop indicator: Inside (as child) overlay label */}
        {isTarget && dropPosition === 'inside' && (
          <div className="mx-2 my-0.5 px-2 py-1 bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 rounded text-[10px] flex items-center gap-1.5 font-medium shadow-md">
            <CornerDownRight className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Сделать дочерней зависимостью от «{node.label}»</span>
          </div>
        )}

        {/* Drop indicator: Bottom line */}
        {isTarget && dropPosition === 'after' && (
          <div className="absolute -bottom-1 left-2 right-2 h-1 bg-cyan-400 rounded-full z-30 shadow-[0_0_8px_rgba(6,182,212,0.8)] flex items-center justify-between">
            <span className="w-2 h-2 rounded-full bg-cyan-300 -ml-1" />
            <span className="text-[9px] font-mono font-bold text-cyan-300 bg-slate-900 px-1 rounded border border-cyan-800">
              Вставить после
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-300 -mr-1" />
          </div>
        )}

        {/* Child Subtree */}
        {hasChildren && !isCollapsed && (
          <div className="relative border-l border-slate-800/80 ml-4 pl-1">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  // Render linear pipeline view
  const renderPipelineView = () => {
    return (
      <div className="space-y-1.5">
        {pipelineData.map((node, index) => {
          const isSelected = node.id === selectedNodeId;
          const isDraggingThis = draggedNodeId === node.id;
          const isTarget = dropTargetId === node.id;
          const parentNode = nodes.find((n) => n.id === node.parentId);

          return (
            <div
              key={node.id}
              draggable
              onDragStart={(e) => handleDragStart(e, node.id)}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, node.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectNode(node.id)}
              className={`relative flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                isDraggingThis
                  ? 'opacity-30 border-dashed border-cyan-500 bg-cyan-950/20'
                  : isSelected
                  ? 'bg-cyan-950/90 text-cyan-200 border-cyan-600 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              } ${
                isTarget ? 'ring-2 ring-cyan-400 border-cyan-400 bg-cyan-950/60' : ''
              }`}
            >
              {/* Order index + Drag handle */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <GripVertical className="w-3.5 h-3.5 text-slate-500 cursor-grab active:cursor-grabbing hover:text-cyan-400 shrink-0" />
                <span className="w-6 h-6 rounded-md bg-slate-950 text-cyan-400 border border-slate-800 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 truncate">
                    {getStatusIcon(node.status)}
                    <span className="font-semibold text-slate-200 truncate">{node.label}</span>
                  </div>
                  {parentNode && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                      <CornerDownRight className="w-2.5 h-2.5 text-slate-500" />
                      <span className="truncate">Зависит от: {parentNode.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Agent */}
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {node.agent && (
                  <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {node.agent}
                  </span>
                )}
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {node.progress}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-200 overflow-hidden">
      {/* Top Header: Controls & View Switcher */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0 space-y-2">
        {/* View Mode Toggle & Expand/Collapse */}
        <div className="flex items-center justify-between gap-2">
          {/* Mode Switcher: Tree vs Pipeline */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                viewMode === 'tree'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Иерархическое дерево зависимостей плана"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Дерево DAG</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`px-2 py-1 rounded-md flex items-center gap-1.5 font-medium transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Линейная последовательность шагов плана"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Очередь</span>
            </button>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 text-xs">
            {viewMode === 'tree' && (
              <>
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-1.5 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Развернуть все ветви"
                >
                  Все +
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-1.5 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Свернуть все ветви"
                >
                  Все -
                </button>
              </>
            )}
            {onResetToDefault && (
              <button
                type="button"
                onClick={onResetToDefault}
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                title="Сбросить структуру плана к исходной"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Поиск по задачам и агентам..."
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-7 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Reorganization Drag & Drop Hint Banner */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-900/60 text-[10px] text-cyan-300">
          <GripVertical className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">
            Перетащите узел для изменения зависимости или очереди шагов
          </span>
        </div>
      </div>

      {/* Floating Notification Banner */}
      {notification && (
        <div
          className={`mx-3 mt-2 px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between gap-2 border shadow-lg transition-all animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Interactive Tree Body */}
      <div className="flex-1 overflow-y-auto p-2.5 pr-1.5 custom-scrollbar text-xs">
        {viewMode === 'tree' ? (
          <div className="space-y-0.5">
            {treeData.map((rootNode) => renderTreeNode(rootNode))}
          </div>
        ) : (
          renderPipelineView()
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-2 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-mono">
        <div className="flex items-center gap-2">
          <span>Узлов: <strong className="text-slate-200">{nodes.length}</strong></span>
          <span>•</span>
          <span>Связей: <strong className="text-cyan-300">{links.length}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>
            {nodes.filter((n) => n.status === 'completed').length} / {nodes.length} готово
          </span>
        </div>
      </div>
    </div>
  );
};
