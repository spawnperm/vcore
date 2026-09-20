/**
 * Automated Unit Tests for LocalStorage Synchronization Service
 */

import {
  STORAGE_KEYS,
  isLocalStorageAvailable,
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
  getStoredMetadata,
  hasPersistedState,
  NavigationContextState,
} from '../utils/storage.ts';
import { MindmapNode, MindmapLink, DocItem, HistoryEvent, TabType } from '../types.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
    failed++;
  }
}

// Simple in-memory localStorage mock for Node.js test environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

export function runStorageTestSuite() {
  console.log('\n💾 Starting LocalStorage Synchronization Test Suite...\n');

  // Inject mock window.localStorage if not in browser
  const mockStorage = new MockLocalStorage();
  const globalAny = globalThis as any;
  const originalWindow = globalAny.window;

  globalAny.window = {
    localStorage: mockStorage,
  };

  try {
    // 1. Availability check
    console.log('📌 Test 1: LocalStorage Availability Check');
    assert(isLocalStorageAvailable() === true, 'localStorage is reported available in test environment');
    assert(hasPersistedState() === false, 'Initially hasPersistedState is false');

    // 2. Nodes Persistence & Retrieval
    console.log('\n📌 Test 2: Mindmap Nodes Persistence & Fallback Handling');
    const defaultNodes: MindmapNode[] = [
      { id: 'node-1', label: 'Backend Core', category: 'stack', status: 'in_progress', progress: 40, x: 10, y: 10, description: 'Desc 1' },
      { id: 'node-2', label: 'Frontend UI', category: 'ui', status: 'draft', progress: 0, x: 20, y: 20, description: 'Desc 2' },
    ];

    // Check fallback when empty
    const loadedEmpty = loadPersistedNodes(defaultNodes);
    assert(loadedEmpty.length === 2, 'Loads fallback nodes when storage is empty');
    assert(loadedEmpty[0].id === 'node-1', 'Fallback node ID matches');

    // Save modified nodes
    const modifiedNodes: MindmapNode[] = [
      { id: 'node-1', label: 'Backend Core', category: 'stack', status: 'completed', progress: 100, x: 10, y: 10, description: 'Desc 1' },
      { id: 'node-2', label: 'Frontend UI', category: 'ui', status: 'in_progress', progress: 75, x: 20, y: 20, description: 'Desc 2' },
      { id: 'node-3', label: 'Audit Tab', category: 'security', status: 'pending', progress: 0, x: 30, y: 30, description: 'Desc 3' },
    ];
    const saveNodesResult = saveNodesToStorage(modifiedNodes);
    assert(saveNodesResult === true, 'saveNodesToStorage returns true on success');
    assert(hasPersistedState() === true, 'hasPersistedState is true after saving nodes');

    const loadedSavedNodes = loadPersistedNodes(defaultNodes);
    assert(loadedSavedNodes.length === 3, 'Loads exactly 3 persisted nodes');
    assert(loadedSavedNodes[0].progress === 100, 'Persisted node progress is preserved (100%)');
    assert(loadedSavedNodes[0].status === 'completed', 'Persisted node status is completed');
    assert(loadedSavedNodes[2].id === 'node-3', 'Newly added node-3 is retained');

    // Test corrupted JSON recovery
    mockStorage.setItem(STORAGE_KEYS.NODES, 'NOT_VALID_JSON{[');
    const loadedAfterCorrupt = loadPersistedNodes(defaultNodes);
    assert(loadedAfterCorrupt.length === 2, 'Corrupted JSON gracefully falls back to default nodes');

    // Re-save valid nodes
    saveNodesToStorage(modifiedNodes);

    // 3. Links Persistence
    console.log('\n📌 Test 3: Mindmap Links Persistence');
    const defaultLinks: MindmapLink[] = [
      { id: 'link-1', source: 'node-1', target: 'node-2' },
    ];
    const newLinks: MindmapLink[] = [
      { id: 'link-1', source: 'node-1', target: 'node-2' },
      { id: 'link-2', source: 'node-2', target: 'node-3', isPulsing: true },
    ];
    saveLinksToStorage(newLinks);
    const loadedLinks = loadPersistedLinks(defaultLinks);
    assert(loadedLinks.length === 2, 'Persisted links count is 2');
    assert(loadedLinks[1].target === 'node-3', 'Persisted link target is node-3');

    // 4. Docs Persistence & Content Updates
    console.log('\n📌 Test 4: Document Content & Approval Status Persistence');
    const defaultDocs: DocItem[] = [
      {
        id: 'adr-001',
        title: 'ADR-001 Architecture',
        type: 'adr',
        status: 'draft',
        author: 'Lead',
        relatedNodes: ['node-1'],
        tags: ['arch'],
        lastModified: 'Вчера',
        content: 'Initial ADR content',
      },
    ];

    const modifiedDocs: DocItem[] = [
      {
        id: 'adr-001',
        title: 'ADR-001 Architecture',
        type: 'adr',
        status: 'approved',
        author: 'Lead',
        relatedNodes: ['node-1'],
        tags: ['arch', 'signed'],
        lastModified: 'Только что (сохранено)',
        content: 'Updated ADR content with compensation logic and SLA guarantees.',
      },
    ];
    saveDocsToStorage(modifiedDocs);
    const loadedDocs = loadPersistedDocs(defaultDocs);
    assert(loadedDocs.length === 1, 'Loaded docs count is 1');
    assert(loadedDocs[0].status === 'approved', 'Document approved status is persisted');
    assert(
      loadedDocs[0].content.includes('compensation logic'),
      'Document updated content is preserved across reloads'
    );

    // 5. History Events Persistence & Append Operations
    console.log('\n📌 Test 5: History Events Tracking & Persistence');
    const defaultHistory: HistoryEvent[] = [
      { id: 'ev-0', time: '10:00', type: 'start', title: 'Start', author: 'System', agents: [] },
    ];
    const liveHistory: HistoryEvent[] = [
      { id: 'ev-commit-1', time: '11:15', type: 'commit', title: 'feat: refund saga', author: 'Иван', prNumber: '#4822', agents: ['Arch-Agent'] },
      { id: 'ev-decision-1', time: '11:20', type: 'decision', title: 'ADR-001 Approved', author: 'Lead', agents: ['Review-Agent'] },
      ...defaultHistory,
    ];
    saveHistoryToStorage(liveHistory);
    const loadedHistory = loadPersistedHistory(defaultHistory);
    assert(loadedHistory.length === 3, 'Loaded history contains all 3 events');
    assert(loadedHistory[0].id === 'ev-commit-1', 'Most recent commit event is at top');
    assert(loadedHistory[0].prNumber === '#4822', 'Commit metadata (PR #4822) is intact');

    // 6. Navigation & Selection Context Persistence
    console.log('\n📌 Test 6: Navigation & Selection Context State Persistence');
    const defaultNav: NavigationContextState = {
      activeTab: 'plan',
      selectedNodeId: 'billing-node',
      selectedDocId: 'adr-042',
      selectedScreenId: 'screen-orders',
      selectedStreamId: 'stream-billing-kafka',
    };

    // Check fallback when uninitialized
    const loadedNavEmpty = loadPersistedNavState(defaultNav);
    assert(loadedNavEmpty.activeTab === 'plan', 'Fallback activeTab is plan');
    assert(loadedNavEmpty.selectedNodeId === 'billing-node', 'Fallback selectedNodeId matches');

    // Save modified navigation state (e.g. user moved to Docs tab on adr-001)
    const customNav: NavigationContextState = {
      activeTab: 'docs',
      selectedNodeId: 'node-3',
      selectedDocId: 'adr-001',
      selectedScreenId: 'screen-refunds',
      selectedStreamId: 'stream-audit-log',
    };
    const saveNavResult = saveNavStateToStorage(customNav);
    assert(saveNavResult === true, 'saveNavStateToStorage returns true on success');

    const loadedNavState = loadPersistedNavState(defaultNav);
    assert(loadedNavState.activeTab === 'docs', 'Persisted activeTab is docs');
    assert(loadedNavState.selectedNodeId === 'node-3', 'Persisted selectedNodeId is node-3');
    assert(loadedNavState.selectedDocId === 'adr-001', 'Persisted selectedDocId is adr-001');
    assert(loadedNavState.selectedScreenId === 'screen-refunds', 'Persisted selectedScreenId is screen-refunds');
    assert(loadedNavState.selectedStreamId === 'stream-audit-log', 'Persisted selectedStreamId is stream-audit-log');

    // Test corrupted or invalid tab fallback
    mockStorage.setItem(STORAGE_KEYS.NAV_STATE, JSON.stringify({ activeTab: 'INVALID_TAB', selectedNodeId: 'x' }));
    const loadedInvalidTabNav = loadPersistedNavState(defaultNav);
    assert(loadedInvalidTabNav.activeTab === 'plan', 'Invalid tab in storage safely falls back to default');

    // Save valid nav back
    saveNavStateToStorage(customNav);

    // 7. Metadata Tracking
    console.log('\n📌 Test 7: Storage Metadata Tracking');
    const meta = getStoredMetadata();
    assert(meta !== null, 'Metadata object exists in localStorage');
    assert(meta?.nodesCount === 3, 'Metadata reflects 3 nodes saved');
    assert(meta?.docsCount === 1, 'Metadata reflects 1 doc saved');
    assert(meta?.historyCount === 3, 'Metadata reflects 3 history events saved');
    assert(typeof meta?.lastSavedAt === 'string', 'Metadata records lastSavedAt ISO timestamp');

    // 8. Clear & Reset State
    console.log('\n📌 Test 8: Clear Stored State & Full Reset');
    clearStoredState();
    assert(hasPersistedState() === false, 'hasPersistedState is false after clearStoredState');
    assert(loadPersistedNodes(defaultNodes).length === 2, 'Nodes cleanly fallback to default after reset');
    assert(loadPersistedDocs(defaultDocs)[0].status === 'draft', 'Docs cleanly fallback to default after reset');
    assert(loadPersistedHistory(defaultHistory).length === 1, 'History cleanly falls back to default after reset');
    assert(loadPersistedNavState(defaultNav).activeTab === 'plan', 'Nav state cleanly falls back to default after reset');
    assert(getStoredMetadata() === null, 'Metadata is cleared after reset');

  } finally {
    globalAny.window = originalWindow;
  }

  console.log('=======================================================');
  console.log(`📊 LocalStorage Test Results: ${passed} passed, ${failed} failed`);
  console.log('=======================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} storage test(s) failed`);
  }
}
