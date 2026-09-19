/**
 * Comprehensive Testing Suite for PlanTab's Dependency Graph & Critical Path Engine
 * 
 * Verifies mathematical correctness for:
 * 1. Single-chain upstream and downstream traversal.
 * 2. Multi-branch DAG topologies (diamond, trees, multi-inbound).
 * 3. Dynamic status changes (pending -> running -> completed) affecting uncompletedBlockers count.
 * 4. Dynamic graph reorganization (adding, removing, redirecting links, reparenting).
 * 5. Explicit dependsOn metadata traversal.
 * 6. Edge cases: disconnected nodes, circular dependency resilience, non-existent node selection.
 */

import { calculateCriticalPath } from '../utils/criticalPath.ts';
import { MindmapNode, MindmapLink } from '../types.ts';

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

export function runPlanTabGraphTestSuite() {
  console.log('🕸️ Starting PlanTab Dependency Graph & Critical Path Test Suite...\n');

  // Baseline Graph Fixtures
  // Topology:
  // Root ("root") -> Stack ("stack-1") -> Auth ("auth-service") -> Billing ("billing-saga")
  //                                    \-> Orders ("order-service") -/
  // Root -> Portal ("portal-ui")
  const baseNodes: MindmapNode[] = [
    { id: 'root', label: 'Root Core', category: 'stack', status: 'completed', x: 0, y: 0, progress: 100, description: 'Root' },
    { id: 'stack-1', label: 'Tech Stack', category: 'stack', status: 'completed', x: 100, y: 100, progress: 100, parentId: 'root', description: 'Stack' },
    { id: 'auth-service', label: 'Auth Service', category: 'security', status: 'completed', x: 200, y: 50, progress: 100, parentId: 'stack-1', description: 'Auth' },
    { id: 'order-service', label: 'Order Service', category: 'infra', status: 'in_progress', x: 200, y: 150, progress: 60, parentId: 'stack-1', description: 'Orders' },
    { id: 'billing-saga', label: 'Refund Saga', category: 'infra', status: 'pending', x: 350, y: 100, progress: 0, parentId: 'stack-1', dependsOn: ['auth-service', 'order-service'], description: 'Billing' },
    { id: 'portal-ui', label: 'Portal Shell', category: 'ui', status: 'in_progress', x: 100, y: 300, progress: 50, parentId: 'root', description: 'Portal' },
    { id: 'audit-tab', label: 'Audit Tab', category: 'ui', status: 'pending', x: 250, y: 300, progress: 0, parentId: 'portal-ui', description: 'Audit' },
    { id: 'isolated-node', label: 'Isolated Node', category: 'ui', status: 'pending', x: 500, y: 500, progress: 0, description: 'Isolated' },
  ];

  const baseLinks: MindmapLink[] = [
    { id: 'l-root-stack', source: 'root', target: 'stack-1' },
    { id: 'l-stack-auth', source: 'stack-1', target: 'auth-service' },
    { id: 'l-stack-orders', source: 'stack-1', target: 'order-service' },
    { id: 'l-auth-billing', source: 'auth-service', target: 'billing-saga' },
    { id: 'l-orders-billing', source: 'order-service', target: 'billing-saga' },
    { id: 'l-root-portal', source: 'root', target: 'portal-ui' },
    { id: 'l-portal-audit', source: 'portal-ui', target: 'audit-tab' },
  ];

  // 1. Selection & Nullability Test
  console.log('📌 Test 1: Selection & Null State Handling');
  {
    const emptyResult = calculateCriticalPath(baseNodes, baseLinks, null);
    assert(emptyResult.blockerNodeIds.size === 0, 'No blockers when selectedNodeId is null');
    assert(emptyResult.criticalLinkIds.size === 0, 'No critical links when selectedNodeId is null');
    assert(emptyResult.dependentNodeIds.size === 0, 'No dependents when selectedNodeId is null');
    assert(emptyResult.selectedNode === null, 'Selected node is null');

    const nonExistent = calculateCriticalPath(baseNodes, baseLinks, 'non-existent-id');
    assert(nonExistent.blockerNodeIds.size === 0, 'No blockers for non-existent node ID');
    assert(nonExistent.selectedNode === null, 'Selected node is null for non-existent node ID');
  }

  // 2. Upstream Blockers in a Diamond Graph (Billing Saga)
  console.log('\n📌 Test 2: Diamond DAG Upstream Critical Path & Blocker Calculation');
  {
    const result = calculateCriticalPath(baseNodes, baseLinks, 'billing-saga');
    
    // Upstream of billing-saga: auth-service, order-service, stack-1, root
    assert(result.blockerNodeIds.has('auth-service'), 'Blockers include direct dependency auth-service');
    assert(result.blockerNodeIds.has('order-service'), 'Blockers include direct dependency order-service');
    assert(result.blockerNodeIds.has('stack-1'), 'Blockers include parent/transitive stack-1');
    assert(result.blockerNodeIds.has('root'), 'Blockers include top-level root');
    assert(!result.blockerNodeIds.has('portal-ui'), 'Blockers exclude unrelated branch portal-ui');
    assert(!result.blockerNodeIds.has('audit-tab'), 'Blockers exclude unrelated audit-tab');

    // Critical Links
    assert(result.criticalLinkIds.has('l-auth-billing'), 'Critical links include l-auth-billing');
    assert(result.criticalLinkIds.has('l-orders-billing'), 'Critical links include l-orders-billing');
    assert(result.criticalLinkIds.has('l-stack-auth'), 'Critical links include l-stack-auth');
    assert(result.criticalLinkIds.has('l-stack-orders'), 'Critical links include l-stack-orders');

    // Downstream of billing-saga (terminal node in this sub-graph)
    assert(result.dependentNodeIds.size === 0, 'Terminal node has 0 dependents');

    // Uncompleted blockers:
    // auth-service = completed
    // stack-1 = completed
    // root = completed (and excluded by id !== 'root')
    // order-service = in-progress (UNCOMPLETED)
    assert(result.uncompletedBlockers.length === 1, 'Exactly 1 uncompleted blocker found');
    assert(result.uncompletedBlockers[0].id === 'order-service', 'Uncompleted blocker is order-service');
  }

  // 3. Downstream Dependent Traversal (Stack-1)
  console.log('\n📌 Test 3: Downstream Dependents Traversal');
  {
    const result = calculateCriticalPath(baseNodes, baseLinks, 'stack-1');
    assert(result.dependentNodeIds.has('auth-service'), 'Dependents include auth-service');
    assert(result.dependentNodeIds.has('order-service'), 'Dependents include order-service');
    assert(result.dependentNodeIds.has('billing-saga'), 'Dependents include transitively blocked billing-saga');
    assert(!result.dependentNodeIds.has('portal-ui'), 'Dependents exclude sister tree portal-ui');
  }

  // 4. Mathematical Accuracy on Node Status Changes
  console.log('\n📌 Test 4: Dynamic Node Status Changes');
  {
    // Step A: Mark order-service as completed
    const updatedNodesA = baseNodes.map((n) =>
      n.id === 'order-service' ? { ...n, status: 'completed' as const, progress: 100 } : n
    );
    const resultA = calculateCriticalPath(updatedNodesA, baseLinks, 'billing-saga');
    assert(resultA.uncompletedBlockers.length === 0, '0 uncompleted blockers when all upstream tasks are completed');

    // Step B: Mark auth-service back to pending (regression)
    const updatedNodesB = updatedNodesA.map((n) =>
      n.id === 'auth-service' ? { ...n, status: 'pending' as const, progress: 0 } : n
    );
    const resultB = calculateCriticalPath(updatedNodesB, baseLinks, 'billing-saga');
    assert(resultB.uncompletedBlockers.length === 1, 'Uncompleted blockers detect auth-service regression');
    assert(resultB.uncompletedBlockers[0].id === 'auth-service', 'Identified regressed task auth-service');

    // Step C: Mark both auth-service and stack-1 as pending
    const updatedNodesC = updatedNodesB.map((n) =>
      n.id === 'stack-1' ? { ...n, status: 'pending' as const, progress: 10 } : n
    );
    const resultC = calculateCriticalPath(updatedNodesC, baseLinks, 'billing-saga');
    assert(resultC.uncompletedBlockers.length === 2, 'Multiple uncompleted blockers correctly aggregated');
    const ids = resultC.uncompletedBlockers.map((b) => b.id);
    assert(ids.includes('auth-service') && ids.includes('stack-1'), 'All uncompleted blockers present in list');
  }

  // 5. Dynamic Link Reorganization (Adding, Removing, Re-wiring)
  console.log('\n📌 Test 5: Dynamic Graph Link Reorganization');
  {
    // Scenario A: Disconnect order-service from billing-saga
    const reorganizedLinksA = baseLinks.filter((l) => l.id !== 'l-orders-billing');
    // Also remove from explicit dependsOn to test pure link rewiring
    const reorganizedNodesA = baseNodes.map((n) =>
      n.id === 'billing-saga' ? { ...n, dependsOn: ['auth-service'] } : n
    );
    const resultA = calculateCriticalPath(reorganizedNodesA, reorganizedLinksA, 'billing-saga');
    assert(!resultA.criticalLinkIds.has('l-orders-billing'), 'Severed link removed from critical links');
    assert(!resultA.blockerNodeIds.has('order-service'), 'order-service is no longer a blocker after unlinking');
    assert(resultA.uncompletedBlockers.length === 0, 'No uncompleted blockers remain after unlinking incomplete task');

    // Scenario B: Rewire audit-tab to block billing-saga
    const reorganizedLinksB: MindmapLink[] = [
      ...baseLinks,
      { id: 'l-audit-billing', source: 'audit-tab', target: 'billing-saga' },
    ];
    const resultB = calculateCriticalPath(baseNodes, reorganizedLinksB, 'billing-saga');
    assert(resultB.criticalLinkIds.has('l-audit-billing'), 'New critical link detected');
    assert(resultB.blockerNodeIds.has('audit-tab'), 'audit-tab became an upstream blocker');
    assert(resultB.blockerNodeIds.has('portal-ui'), 'portal-ui transitively became an upstream blocker');
    // audit-tab is 'pending' and portal-ui is 'in-progress' -> both uncompleted blockers!
    const uncompletedIds = resultB.uncompletedBlockers.map((b) => b.id);
    assert(uncompletedIds.includes('audit-tab'), 'audit-tab is in uncompleted blockers');
    assert(uncompletedIds.includes('portal-ui'), 'portal-ui is in uncompleted blockers');
    assert(uncompletedIds.includes('order-service'), 'order-service is in uncompleted blockers');
    assert(resultB.uncompletedBlockers.length === 3, 'Exactly 3 uncompleted blockers across newly bridged branches');
  }

  // 6. Cyclic Dependency Resilience
  console.log('\n📌 Test 6: Cyclic & Looping Dependency Resilience');
  {
    // Create an intentional loop: nodeA -> nodeB -> nodeA
    const cyclicNodes: MindmapNode[] = [
      { id: 'loop-a', label: 'Loop A', category: 'infra', status: 'pending', x: 0, y: 0, progress: 0, description: 'Loop A' },
      { id: 'loop-b', label: 'Loop B', category: 'infra', status: 'in_progress', x: 100, y: 0, progress: 50, description: 'Loop B' },
    ];
    const cyclicLinks: MindmapLink[] = [
      { id: 'l-ab', source: 'loop-a', target: 'loop-b' },
      { id: 'l-ba', source: 'loop-b', target: 'loop-a' },
    ];

    // Traversal must terminate gracefully without infinite loops or stack overflows
    const resultA = calculateCriticalPath(cyclicNodes, cyclicLinks, 'loop-a');
    assert(resultA.blockerNodeIds.has('loop-b'), 'Cycle node B identified as blocker');
    assert(resultA.dependentNodeIds.has('loop-b'), 'Cycle node B identified as dependent');
    assert(resultA.criticalLinkIds.has('l-ba'), 'Link ba is in critical links');
    assert(resultA.criticalLinkIds.has('l-ab'), 'Link ab is in critical links');
  }

  // 7. Isolated Node Evaluation
  console.log('\n📌 Test 7: Completely Isolated Node Evaluation');
  {
    const result = calculateCriticalPath(baseNodes, baseLinks, 'isolated-node');
    assert(result.blockerNodeIds.size === 0, 'Isolated node has 0 blockers');
    assert(result.criticalLinkIds.size === 0, 'Isolated node has 0 critical links');
    assert(result.dependentNodeIds.size === 0, 'Isolated node has 0 dependents');
    assert(result.uncompletedBlockers.length === 0, 'Isolated node has 0 uncompleted blockers');
  }

  console.log('\n' + '='.repeat(55));
  console.log(`📊 PlanTab Graph Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(55) + '\n');

  if (failed > 0) {
    throw new Error(`PlanTab test suite failed with ${failed} failure(s)`);
  }
}

// Allow direct execution when run via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runPlanTabGraphTestSuite();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
