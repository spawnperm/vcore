/**
 * Unit Tests for Node History Utility Functions
 * Validates node-to-history association, filtering, and metric aggregations.
 */

import { isEventRelatedToNode, getNodeHistoryEvents, getNodeHistoryStats } from '../utils/nodeHistory.ts';
import { HistoryEvent, MindmapNode } from '../types.ts';

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

export function runNodeHistoryTestSuite(): { passed: number; failed: number } {
  passed = 0;
  failed = 0;
  console.log('📜 Starting Node History Integration Unit Tests...\n');

  const testNode: MindmapNode = {
    id: 'billing-node',
    label: 'Billing Service',
    category: 'stack',
    status: 'in_progress',
    progress: 70,
    x: 100,
    y: 100,
    description: 'Оркестратор платежей и возвратов',
  };

  const otherNode: MindmapNode = {
    id: 'auth-service',
    label: 'Auth Service',
    category: 'security',
    status: 'completed',
    progress: 100,
    x: 200,
    y: 100,
    description: 'Авторизация и JWT',
  };

  const rootNode: MindmapNode = {
    id: 'root',
    label: 'План проекта «refund»',
    category: 'stack',
    status: 'completed',
    progress: 100,
    x: 0,
    y: 0,
    description: 'Корень плана',
  };

  const sampleEvents: HistoryEvent[] = [
    {
      id: 'ev-1',
      time: '14:32',
      type: 'commit',
      title: 'Коммит feature/refund-endpoint',
      author: 'Иван Петров',
      agents: ['Billing'],
      relatedNodeId: 'billing-node',
      canRollback: true,
      servicesAffected: ['Billing'],
      details: 'Реализована сага',
    },
    {
      id: 'ev-2',
      time: '13:10',
      type: 'deploy',
      title: 'Деплой в staging',
      author: 'CI/CD Bot',
      agents: ['Infra'],
      relatedNodeId: 'billing-node',
      canRollback: true,
      details: 'Деплой billing v1.2',
    },
    {
      id: 'ev-3',
      time: '12:00',
      type: 'incident',
      title: 'Инцидент INC-102: Auth timeout',
      author: 'SecOps',
      agents: ['Security'],
      relatedNodeId: 'auth-service',
      canRollback: false,
      details: 'Таймаут в auth-service',
    },
    {
      id: 'ev-4',
      time: '09:00',
      type: 'start',
      title: 'Старт плана refund',
      author: 'Иван Петров',
      agents: ['Squad'],
      relatedNodeId: 'root',
      canRollback: false,
      details: 'Инициализация проекта',
    },
  ];

  // 1. Direct ID matching
  console.log('📌 Test 1: Direct ID matching');
  {
    assert(isEventRelatedToNode(sampleEvents[0], testNode), 'Direct relatedNodeId matches node id');
    assert(!isEventRelatedToNode(sampleEvents[2], testNode), 'Different relatedNodeId does not match node id');
    assert(isEventRelatedToNode(sampleEvents[2], otherNode), 'Event matches auth-service node id');
    assert(isEventRelatedToNode(sampleEvents[3], rootNode), 'Start event matches root node');
  }

  // 2. Fuzzy / Services matching
  console.log('📌 Test 2: Service Affected & Label matching');
  {
    const implicitEvent: HistoryEvent = {
      id: 'ev-5',
      time: '15:00',
      type: 'commit',
      title: 'Обновление конфигурации nats для Billing Service',
      author: 'Архитектор',
      agents: ['Billing'],
      canRollback: false,
    };
    assert(isEventRelatedToNode(implicitEvent, testNode), 'Event mentioning node label matches node');
  }

  // 3. getNodeHistoryEvents Filtering
  console.log('📌 Test 3: getNodeHistoryEvents filtering');
  {
    const billingEvents = getNodeHistoryEvents(sampleEvents, testNode);
    assert(billingEvents.length === 2, 'Billing node retrieves exactly 2 events');
    assert(billingEvents[0].id === 'ev-1', 'First event is ev-1');
    assert(billingEvents[1].id === 'ev-2', 'Second event is ev-2');

    const authEvents = getNodeHistoryEvents(sampleEvents, otherNode);
    assert(authEvents.length === 1, 'Auth node retrieves exactly 1 event');
    assert(authEvents[0].id === 'ev-3', 'Event is ev-3');

    const nullResult = getNodeHistoryEvents(sampleEvents, null);
    assert(nullResult.length === 0, 'Null node returns empty array');
  }

  // 4. getNodeHistoryStats Calculations
  console.log('📌 Test 4: getNodeHistoryStats aggregations');
  {
    const billingEvents = getNodeHistoryEvents(sampleEvents, testNode);
    const stats = getNodeHistoryStats(billingEvents);

    assert(stats.total === 2, 'Stats total equals 2');
    assert(stats.commits === 1, 'Stats commits equals 1');
    assert(stats.deploys === 1, 'Stats deploys equals 1');
    assert(stats.incidents === 0, 'Stats incidents equals 0');
    assert(stats.hasRollbackable === true, 'Billing events have rollbackable event');
    assert(stats.lastUpdatedTime === '14:32', 'Last updated time is 14:32');

    const emptyStats = getNodeHistoryStats([]);
    assert(emptyStats.total === 0, 'Empty events gives 0 total');
    assert(emptyStats.lastUpdatedTime === null, 'Empty events gives null lastUpdatedTime');
    assert(emptyStats.hasRollbackable === false, 'Empty events has no rollbackable');
  }

  console.log(`\n📊 Node History Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
