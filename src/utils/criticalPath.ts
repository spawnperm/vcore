import { MindmapNode, MindmapLink } from '../types.ts';

export interface CriticalPathAnalysis {
  blockerNodeIds: Set<string>;
  criticalLinkIds: Set<string>;
  dependentNodeIds: Set<string>;
  selectedNode: MindmapNode | null;
  uncompletedBlockers: MindmapNode[];
}

/**
 * Pure mathematical graph analysis for dependency trees & critical path calculation.
 * Computes upstream blockers, downstream dependents, and critical links.
 */
export function calculateCriticalPath(
  nodes: MindmapNode[],
  links: MindmapLink[],
  selectedNodeId: string | null
): CriticalPathAnalysis {
  const selNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNodeId || !selNode) {
    return {
      blockerNodeIds: new Set<string>(),
      criticalLinkIds: new Set<string>(),
      dependentNodeIds: new Set<string>(),
      selectedNode: null,
      uncompletedBlockers: [],
    };
  }

  const blockers = new Set<string>();
  const criticalLinks = new Set<string>();
  const dependents = new Set<string>();

  // 1. Upstream blockers traversal (Ancestors)
  // Explores parentId, explicit dependsOn array, and direct incoming links
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

  // 2. Downstream dependents traversal (Descendants)
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
    nodes
      .filter((n) => n.parentId === curr)
      .forEach((child) => {
        if (!visitedDown.has(child.id)) {
          visitedDown.add(child.id);
          dependents.add(child.id);
          queueDown.push(child.id);
        }
      });
  }

  const uncompletedBlockers = Array.from(blockers)
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is MindmapNode => !!n && n.status !== 'completed' && n.id !== 'root');

  return {
    blockerNodeIds: blockers,
    criticalLinkIds: criticalLinks,
    dependentNodeIds: dependents,
    selectedNode: selNode,
    uncompletedBlockers,
  };
}
