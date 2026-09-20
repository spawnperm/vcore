/**
 * Unit Tests for Critical Path Graph Algorithm
 * Tests calculateCriticalPath in src/utils/criticalPath.ts
 */

import { calculateCriticalPath } from '../utils/criticalPath.ts';
import { MindmapNode, MindmapLink } from '../types.ts';

export function runCriticalPathIsolatedTestSuite(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, message?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${message || 'Assertion failed'}`);
      failed++;
    }
  }

  console.log('📐 Starting Critical Path Isolated Unit Tests...');

  // 1. Null / Non-existent Node Selection
  console.log('📌 Test 1: Null or Non-existent Selection');
  {
    const resNull = calculateCriticalPath([], [], null);
    assert(resNull.selectedNode === null, 'Null ID returns null selectedNode');
    assert(resNull.blockerNodeIds.size === 0, 'Null ID has 0 blockers');
    assert(resNull.criticalLinkIds.size === 0, 'Null ID has 0 critical links');
    assert(resNull.uncompletedBlockers.length === 0, 'Null ID has 0 uncompleted blockers');

    const resMissing = calculateCriticalPath(
      [{ id: 'node-1', label: 'Task 1', category: 'stack', status: 'pending', progress: 0, x: 0, y: 0, description: '' }],
      [],
      'non-existent-id'
    );
    assert(resMissing.selectedNode === null, 'Non-existent ID returns null selectedNode');
  }

  // 2. Linear Chain Dependency
  console.log('📌 Test 2: Linear Chain Upstream & Downstream');
  {
    // A -> B -> C
    const nodes: MindmapNode[] = [
      { id: 'node-a', label: 'Task A', category: 'stack', status: 'completed', progress: 100, x: 0, y: 0, description: '' },
      { id: 'node-b', label: 'Task B', category: 'stack', status: 'in_progress', progress: 50, x: 0, y: 0, description: '' },
      { id: 'node-c', label: 'Task C', category: 'stack', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
    ];
    const links: MindmapLink[] = [
      { id: 'link-ab', source: 'node-a', target: 'node-b' },
      { id: 'link-bc', source: 'node-b', target: 'node-c' },
    ];

    // Select middle node B
    const resB = calculateCriticalPath(nodes, links, 'node-b');
    assert(resB.blockerNodeIds.has('node-a'), 'B blockers include upstream node A');
    assert(!resB.blockerNodeIds.has('node-c'), 'B blockers exclude downstream node C');
    assert(resB.dependentNodeIds.has('node-c'), 'B dependents include downstream node C');
    assert(!resB.dependentNodeIds.has('node-a'), 'B dependents exclude upstream node A');
    assert(resB.criticalLinkIds.has('link-ab'), 'Critical links include link A->B');

    // Select terminal node C
    const resC = calculateCriticalPath(nodes, links, 'node-c');
    assert(resC.blockerNodeIds.has('node-a'), 'C blockers transitively include node A');
    assert(resC.blockerNodeIds.has('node-b'), 'C blockers include node B');
    assert(resC.criticalLinkIds.has('link-ab'), 'Transitive critical link A->B included');
    assert(resC.criticalLinkIds.has('link-bc'), 'Direct critical link B->C included');
    assert(resC.uncompletedBlockers.length === 1, 'Exactly 1 uncompleted blocker for C (node-b)');
    assert(resC.uncompletedBlockers[0].id === 'node-b', 'Uncompleted blocker is node-b');
  }

  // 3. Parent-Child Hierarchy Traversal
  console.log('📌 Test 3: Parent-Child Structural Dependencies');
  {
    const nodes: MindmapNode[] = [
      { id: 'parent-1', label: 'Parent Feature', category: 'stack', status: 'in_progress', progress: 40, x: 0, y: 0, description: '' },
      { id: 'child-1', parentId: 'parent-1', label: 'Child Task', category: 'ui', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
      { id: 'child-2', parentId: 'parent-1', label: 'Child Task 2', category: 'ui', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
    ];
    const links: MindmapLink[] = [
      { id: 'p-c1', source: 'parent-1', target: 'child-1' },
    ];

    const resChild = calculateCriticalPath(nodes, links, 'child-1');
    assert(resChild.blockerNodeIds.has('parent-1'), 'Child blocker is parent-1');
    assert(resChild.criticalLinkIds.has('p-c1'), 'Critical link parent->child included');

    const resParent = calculateCriticalPath(nodes, links, 'parent-1');
    assert(resParent.dependentNodeIds.has('child-1'), 'Parent dependents include child-1');
    assert(resParent.dependentNodeIds.has('child-2'), 'Parent dependents include child-2 by parentId');
  }

  // 4. Explicit dependsOn Array
  console.log('📌 Test 4: Explicit dependsOn Array');
  {
    const nodes: MindmapNode[] = [
      { id: 'dep-x', label: 'Dependency X', category: 'infra', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
      { id: 'dep-y', label: 'Dependency Y', category: 'infra', status: 'completed', progress: 100, x: 0, y: 0, description: '' },
      { id: 'task-main', dependsOn: ['dep-x', 'dep-y'], label: 'Main Task', category: 'stack', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
    ];

    const res = calculateCriticalPath(nodes, [], 'task-main');
    assert(res.blockerNodeIds.has('dep-x'), 'Blockers include explicit dep-x');
    assert(res.blockerNodeIds.has('dep-y'), 'Blockers include explicit dep-y');
    assert(res.uncompletedBlockers.length === 1, 'Only dep-x is uncompleted');
    assert(res.uncompletedBlockers[0].id === 'dep-x', 'Uncompleted blocker is dep-x');
  }

  // 5. Root Node Exclusion from Uncompleted Blockers
  console.log('📌 Test 5: Root Node Filter');
  {
    const nodes: MindmapNode[] = [
      { id: 'root', label: 'Project Root', category: 'stack', status: 'in_progress', progress: 20, x: 0, y: 0, description: '' },
      { id: 'subtask', parentId: 'root', label: 'Subtask', category: 'ui', status: 'pending', progress: 0, x: 0, y: 0, description: '' },
    ];

    const res = calculateCriticalPath(nodes, [], 'subtask');
    assert(res.blockerNodeIds.has('root'), 'Root is an upstream blocker');
    assert(
      !res.uncompletedBlockers.some((b) => b.id === 'root'),
      'Root is excluded from uncompletedBlockers list'
    );
  }

  console.log(`\n📊 Critical Path Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
