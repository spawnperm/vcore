/**
 * React hook for orchestrating LocalStorage synchronization
 * for Mindmap Nodes, Links, Docs, and History Events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MindmapNode, MindmapLink, DocItem, HistoryEvent } from '../types';
import {
  loadPersistedNodes,
  loadPersistedLinks,
  loadPersistedDocs,
  loadPersistedHistory,
  saveNodesToStorage,
  saveLinksToStorage,
  saveDocsToStorage,
  saveHistoryToStorage,
  clearStoredState,
  isLocalStorageAvailable,
  getStoredMetadata,
  STORAGE_KEYS,
} from '../utils/storage';

interface UseLocalStorageSyncOptions {
  initialNodes: MindmapNode[];
  initialLinks: MindmapLink[];
  initialDocs: DocItem[];
  initialHistory: HistoryEvent[];
}

export function useLocalStorageSync({
  initialNodes,
  initialLinks,
  initialDocs,
  initialHistory,
}: UseLocalStorageSyncOptions) {
  const isAvailable = isLocalStorageAvailable();

  // Initialize state once from localStorage (or fallback to defaults)
  const [nodes, setNodes] = useState<MindmapNode[]>(() =>
    loadPersistedNodes(initialNodes)
  );
  const [links, setLinks] = useState<MindmapLink[]>(() =>
    loadPersistedLinks(initialLinks)
  );
  const [docs, setDocs] = useState<DocItem[]>(() =>
    loadPersistedDocs(initialDocs)
  );
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>(() =>
    loadPersistedHistory(initialHistory)
  );

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    const meta = getStoredMetadata();
    return meta?.lastSavedAt ? new Date(meta.lastSavedAt) : null;
  });
  const [isSaving, setIsSaving] = useState(false);

  // Track if this is initial mount to avoid redundant immediate writes
  const isMounted = useRef(false);

  // Persist nodes & links
  useEffect(() => {
    if (!isMounted.current) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveNodesToStorage(nodes);
      saveLinksToStorage(links);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [nodes, links]);

  // Persist docs
  useEffect(() => {
    if (!isMounted.current) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveDocsToStorage(docs);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [docs]);

  // Persist history
  useEffect(() => {
    if (!isMounted.current) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveHistoryToStorage(historyEvents);
      setLastSaved(new Date());
      setIsSaving(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [historyEvents]);

  // Mark mounted after first render
  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Cross-tab synchronization listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === STORAGE_KEYS.NODES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNodes(parsed);
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.DOCS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setDocs(parsed);
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.HISTORY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setHistoryEvents(parsed);
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.LINKS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setLinks(parsed);
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Reset to original defaults and clear localStorage
  const resetToDefaults = useCallback(() => {
    clearStoredState();
    setNodes(initialNodes);
    setLinks(initialLinks);
    setDocs(initialDocs);
    setHistoryEvents(initialHistory);
    setLastSaved(null);
  }, [initialNodes, initialLinks, initialDocs, initialHistory]);

  return {
    nodes,
    setNodes,
    links,
    setLinks,
    docs,
    setDocs,
    historyEvents,
    setHistoryEvents,
    lastSaved,
    isSaving,
    isStorageAvailable: isAvailable,
    resetToDefaults,
  };
}
