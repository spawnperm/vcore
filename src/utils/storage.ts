/**
 * LocalStorage Synchronization Service for Mirovizor (vcore)
 * Persists and restores Mindmap Nodes, Links, Docs, and History Events
 * with safe schema validation, error recovery, and cross-tab awareness.
 */

import { MindmapNode, MindmapLink, DocItem, HistoryEvent } from '../types';

export const STORAGE_KEYS = {
  NODES: 'vcore_nodes_v1',
  LINKS: 'vcore_links_v1',
  DOCS: 'vcore_docs_v1',
  HISTORY: 'vcore_history_v1',
  METADATA: 'vcore_storage_meta_v1',
} as const;

export interface StorageMetadata {
  lastSavedAt: string;
  version: string;
  nodesCount: number;
  docsCount: number;
  historyCount: number;
}

/**
 * Check if window.localStorage is accessible and writable in current environment
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const testKey = '__vcore_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates array of MindmapNodes
 */
function isValidNodesArray(data: unknown): data is MindmapNode[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.label === 'string' &&
      typeof item.progress === 'number'
  );
}

/**
 * Validates array of MindmapLinks
 */
function isValidLinksArray(data: unknown): data is MindmapLink[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.source === 'string' &&
      typeof item.target === 'string'
  );
}

/**
 * Validates array of DocItems
 */
function isValidDocsArray(data: unknown): data is DocItem[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.title === 'string' &&
      typeof item.content === 'string'
  );
}

/**
 * Validates array of HistoryEvents
 */
function isValidHistoryArray(data: unknown): data is HistoryEvent[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.type === 'string' &&
      typeof item.title === 'string'
  );
}

/**
 * Load persisted nodes from localStorage, falling back to default
 */
export function loadPersistedNodes(fallback: MindmapNode[]): MindmapNode[] {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.NODES);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isValidNodesArray(parsed)) {
      return parsed;
    }
    console.warn('[StorageSync] Invalid nodes structure in localStorage, using fallback.');
    return fallback;
  } catch (err) {
    console.error('[StorageSync] Failed to load nodes from localStorage:', err);
    return fallback;
  }
}

/**
 * Load persisted links from localStorage, falling back to default
 */
export function loadPersistedLinks(fallback: MindmapLink[]): MindmapLink[] {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LINKS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isValidLinksArray(parsed)) {
      return parsed;
    }
    return fallback;
  } catch (err) {
    console.error('[StorageSync] Failed to load links from localStorage:', err);
    return fallback;
  }
}

/**
 * Load persisted docs from localStorage, falling back to default
 */
export function loadPersistedDocs(fallback: DocItem[]): DocItem[] {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.DOCS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isValidDocsArray(parsed)) {
      return parsed;
    }
    console.warn('[StorageSync] Invalid docs structure in localStorage, using fallback.');
    return fallback;
  } catch (err) {
    console.error('[StorageSync] Failed to load docs from localStorage:', err);
    return fallback;
  }
}

/**
 * Load persisted history events from localStorage, falling back to default
 */
export function loadPersistedHistory(fallback: HistoryEvent[]): HistoryEvent[] {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isValidHistoryArray(parsed)) {
      return parsed;
    }
    console.warn('[StorageSync] Invalid history structure in localStorage, using fallback.');
    return fallback;
  } catch (err) {
    console.error('[StorageSync] Failed to load history from localStorage:', err);
    return fallback;
  }
}

/**
 * Save MindmapNodes to localStorage
 */
export function saveNodesToStorage(nodes: MindmapNode[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.NODES, JSON.stringify(nodes));
    touchMetadata({ nodesCount: nodes.length });
    return true;
  } catch (err) {
    console.error('[StorageSync] Failed to save nodes to localStorage:', err);
    return false;
  }
}

/**
 * Save MindmapLinks to localStorage
 */
export function saveLinksToStorage(links: MindmapLink[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
    return true;
  } catch (err) {
    console.error('[StorageSync] Failed to save links to localStorage:', err);
    return false;
  }
}

/**
 * Save DocItems to localStorage
 */
export function saveDocsToStorage(docs: DocItem[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
    touchMetadata({ docsCount: docs.length });
    return true;
  } catch (err) {
    console.error('[StorageSync] Failed to save docs to localStorage:', err);
    return false;
  }
}

/**
 * Save HistoryEvents to localStorage
 */
export function saveHistoryToStorage(history: HistoryEvent[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    touchMetadata({ historyCount: history.length });
    return true;
  } catch (err) {
    console.error('[StorageSync] Failed to save history to localStorage:', err);
    return false;
  }
}

/**
 * Touch metadata with latest sync timestamp
 */
function touchMetadata(partial: Partial<StorageMetadata> = {}) {
  if (!isLocalStorageAvailable()) return;
  try {
    const existing = getStoredMetadata();
    const updated: StorageMetadata = {
      version: '1.0.0',
      lastSavedAt: new Date().toISOString(),
      nodesCount: partial.nodesCount ?? existing?.nodesCount ?? 0,
      docsCount: partial.docsCount ?? existing?.docsCount ?? 0,
      historyCount: partial.historyCount ?? existing?.historyCount ?? 0,
    };
    window.localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Get stored metadata
 */
export function getStoredMetadata(): StorageMetadata | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.METADATA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Clear all persisted data in localStorage and restore pristine defaults
 */
export function clearStoredState(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.NODES);
    window.localStorage.removeItem(STORAGE_KEYS.LINKS);
    window.localStorage.removeItem(STORAGE_KEYS.DOCS);
    window.localStorage.removeItem(STORAGE_KEYS.HISTORY);
    window.localStorage.removeItem(STORAGE_KEYS.METADATA);
  } catch (err) {
    console.error('[StorageSync] Failed to clear localStorage:', err);
  }
}

/**
 * Check if there is active persisted state in localStorage
 */
export function hasPersistedState(): boolean {
  if (!isLocalStorageAvailable()) return false;
  return Boolean(
    window.localStorage.getItem(STORAGE_KEYS.NODES) ||
    window.localStorage.getItem(STORAGE_KEYS.DOCS) ||
    window.localStorage.getItem(STORAGE_KEYS.HISTORY)
  );
}
