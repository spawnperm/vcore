import { HistoryEvent, MindmapNode } from '../types';

/**
 * Utility functions for filtering, grouping, and analyzing history events
 * associated with a specific mindmap node.
 */

/**
 * Normalizes text for case-insensitive and clean matching.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-zа-я0-9]/gi, '');
}

/**
 * Determines whether a history event belongs to or is related to a specific node.
 */
export function isEventRelatedToNode(event: HistoryEvent, node: MindmapNode): boolean {
  if (!node || !event) return false;

  // 1. Direct match by ID
  if (event.relatedNodeId && event.relatedNodeId === node.id) {
    return true;
  }

  // 2. Root node matches global start events
  if (node.id === 'root' && (event.type === 'start' || event.relatedNodeId === 'root')) {
    return true;
  }

  const nodeLabelNorm = normalize(node.label);
  const nodeIdNorm = normalize(node.id);

  // 3. Match in servicesAffected
  if (event.servicesAffected && event.servicesAffected.length > 0) {
    const hasServiceMatch = event.servicesAffected.some((service) => {
      const sNorm = normalize(service);
      return (
        sNorm.includes(nodeLabelNorm) ||
        nodeLabelNorm.includes(sNorm) ||
        sNorm.includes(nodeIdNorm) ||
        nodeIdNorm.includes(sNorm)
      );
    });
    if (hasServiceMatch) return true;
  }

  // 4. Match in event title or details
  const titleNorm = normalize(event.title);
  if (titleNorm.includes(nodeLabelNorm) || titleNorm.includes(nodeIdNorm)) {
    return true;
  }

  if (event.details) {
    const detailsNorm = normalize(event.details);
    if (detailsNorm.includes(nodeLabelNorm) || detailsNorm.includes(nodeIdNorm)) {
      return true;
    }
  }

  return false;
}

/**
 * Filters history events for a given node.
 */
export function getNodeHistoryEvents(events: HistoryEvent[], node: MindmapNode | null | undefined): HistoryEvent[] {
  if (!node || !events || events.length === 0) return [];
  return events.filter((ev) => isEventRelatedToNode(ev, node));
}

export interface NodeHistoryStats {
  total: number;
  commits: number;
  deploys: number;
  incidents: number;
  decisions: number;
  nodeAdded: number;
  lastUpdatedTime: string | null;
  hasRollbackable: boolean;
}

/**
 * Computes summary statistics for a node's change history.
 */
export function getNodeHistoryStats(events: HistoryEvent[]): NodeHistoryStats {
  const stats: NodeHistoryStats = {
    total: events.length,
    commits: 0,
    deploys: 0,
    incidents: 0,
    decisions: 0,
    nodeAdded: 0,
    lastUpdatedTime: events.length > 0 ? events[0].time : null,
    hasRollbackable: false,
  };

  for (const ev of events) {
    switch (ev.type) {
      case 'commit':
        stats.commits++;
        break;
      case 'deploy':
        stats.deploys++;
        break;
      case 'incident':
        stats.incidents++;
        break;
      case 'decision':
        stats.decisions++;
        break;
      case 'node_added':
        stats.nodeAdded++;
        break;
    }
    if (ev.canRollback) {
      stats.hasRollbackable = true;
    }
  }

  return stats;
}
