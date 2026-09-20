/**
 * React hook for orchestrating LocalStorage synchronization
 * for Mindmap Nodes, Links, Docs, and History Events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MindmapNode, MindmapLink, DocItem, HistoryEvent, TabType } from '../types';
import {
  loadPersistedNodes,
  loadPersistedLinks,
  loadPersistedDocs,
  loadPersistedHistory,
  loadPersistedNavState,
  saveNodesToStorage,
  saveLinksToStorage,
  saveDocsToStorage,
  saveHistoryToStorage,
  saveNavStateToStorage,
  clearStoredState,
  isLocalStorageAvailable,
  getStoredMetadata,
  isValidNavState,
  NavigationContextState,
  STORAGE_KEYS,
} from '../utils/storage';

interface UseLocalStorageSyncOptions {
  initialNodes: MindmapNode[];
  initialLinks: MindmapLink[];
  initialDocs: DocItem[];
  initialHistory: HistoryEvent[];
  initialTab?: TabType;
  initialSelectedNodeId?: string;
  initialSelectedDocId?: string;
  initialSelectedScreenId?: string;
  initialSelectedStreamId?: string;
}

export function useLocalStorageSync({
  initialNodes,
  initialLinks,
  initialDocs,
  initialHistory,
  initialTab = 'plan',
  initialSelectedNodeId = 'billing-node',
  initialSelectedDocId = 'adr-042',
  initialSelectedScreenId = 'screen-orders',
  initialSelectedStreamId = 'stream-billing-kafka',
}: UseLocalStorageSyncOptions) {
  const isAvailable = isLocalStorageAvailable();

  // Initialize data state once from localStorage (or fallback to defaults)
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

  // Initialize navigation and context state from localStorage (or fallback to defaults)
  const defaultNav: NavigationContextState = {
    activeTab: initialTab,
    selectedNodeId: initialSelectedNodeId,
    selectedDocId: initialSelectedDocId,
    selectedScreenId: initialSelectedScreenId,
    selectedStreamId: initialSelectedStreamId,
  };

  const initialLoadedNav = loadPersistedNavState(defaultNav);

  const [activeTab, setActiveTab] = useState<TabType>(initialLoadedNav.activeTab);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialLoadedNav.selectedNodeId);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialLoadedNav.selectedDocId);
  const [selectedScreenId, setSelectedScreenId] = useState<string>(initialLoadedNav.selectedScreenId);
  const [selectedStreamId, setSelectedStreamId] = useState<string>(initialLoadedNav.selectedStreamId);

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

  // Persist navigation & selection context
  useEffect(() => {
    if (!isMounted.current) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveNavStateToStorage({
        activeTab,
        selectedNodeId,
        selectedDocId,
        selectedScreenId,
        selectedStreamId,
      });
      setLastSaved(new Date());
      setIsSaving(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, selectedNodeId, selectedDocId, selectedScreenId, selectedStreamId]);

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
      } else if (e.key === STORAGE_KEYS.NAV_STATE && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (isValidNavState(parsed)) {
            setActiveTab(parsed.activeTab);
            setSelectedNodeId(parsed.selectedNodeId);
            setSelectedDocId(parsed.selectedDocId);
            setSelectedScreenId(parsed.selectedScreenId);
            setSelectedStreamId(parsed.selectedStreamId);
          }
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
    setActiveTab(defaultNav.activeTab);
    setSelectedNodeId(defaultNav.selectedNodeId);
    setSelectedDocId(defaultNav.selectedDocId);
    setSelectedScreenId(defaultNav.selectedScreenId);
    setSelectedStreamId(defaultNav.selectedStreamId);
    setLastSaved(null);
  }, [
    initialNodes,
    initialLinks,
    initialDocs,
    initialHistory,
    defaultNav.activeTab,
    defaultNav.selectedNodeId,
    defaultNav.selectedDocId,
    defaultNav.selectedScreenId,
    defaultNav.selectedStreamId,
  ]);

  return {
    nodes,
    setNodes,
    links,
    setLinks,
    docs,
    setDocs,
    historyEvents,
    setHistoryEvents,
    activeTab,
    setActiveTab,
    selectedNodeId,
    setSelectedNodeId,
    selectedDocId,
    setSelectedDocId,
    selectedScreenId,
    setSelectedScreenId,
    selectedStreamId,
    setSelectedStreamId,
    lastSaved,
    isSaving,
    isStorageAvailable: isAvailable,
    resetToDefaults,
  };
}
