/**
 * Unit Tests for Line-level Text Diff Engine (LCS algorithm)
 * Tests computeLineDiff in src/utils/diffUtils.ts
 */

import { computeLineDiff } from '../utils/diffUtils.ts';

export function runDiffUtilsTestSuite(): { passed: number; failed: number } {
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

  console.log('📝 Starting DiffUtils (LCS Engine) Unit Tests...');

  // 1. Identical text diffing
  console.log('📌 Test 1: Identical Texts');
  {
    const text = 'line 1\nline 2\nline 3';
    const res = computeLineDiff(text, text);
    assert(res.additions === 0, 'Identical texts have 0 additions');
    assert(res.deletions === 0, 'Identical texts have 0 deletions');
    assert(res.unchanged === 3, 'Identical texts have 3 unchanged lines');
    assert(res.unified.length === 3, 'Unified diff has exactly 3 lines');
    assert(res.unified.every((l) => l.type === 'unchanged'), 'All lines marked unchanged');
    assert(res.sideBySide.length === 3, 'Side-by-side has 3 rows');
    assert(
      res.sideBySide[0].left?.content === 'line 1' && res.sideBySide[0].right?.content === 'line 1',
      'Side-by-side row 1 matches left and right'
    );
  }

  // 2. Empty string comparisons
  console.log('📌 Test 2: Empty Inputs');
  {
    const emptyRes = computeLineDiff('', '');
    assert(emptyRes.additions === 0 && emptyRes.deletions === 0, 'Both empty gives 0 additions & deletions');
    assert(emptyRes.unified.length === 1 && emptyRes.unified[0].content === '', 'Single empty line is unchanged');

    const addedFromEmpty = computeLineDiff('', 'alpha\nbeta');
    assert(addedFromEmpty.additions >= 1, 'Non-empty target adds lines');

    const deletedToEmpty = computeLineDiff('alpha\nbeta', '');
    assert(deletedToEmpty.deletions >= 1, 'Empty target deletes lines');
  }

  // 3. Additions only
  console.log('📌 Test 3: Additions Only');
  {
    const textA = 'header\nfooter';
    const textB = 'header\nmiddle 1\nmiddle 2\nfooter';
    const res = computeLineDiff(textA, textB);
    assert(res.additions === 2, 'Detects exactly 2 additions');
    assert(res.deletions === 0, 'Detects 0 deletions');
    assert(res.unchanged === 2, 'Detects 2 unchanged lines');

    const addedLines = res.unified.filter((l) => l.type === 'added');
    assert(addedLines[0].content === 'middle 1', 'First added line content matches');
    assert(addedLines[1].content === 'middle 2', 'Second added line content matches');
    assert(addedLines[0].lineNumB === 2, 'First added line number in target is 2');
    assert(addedLines[1].lineNumB === 3, 'Second added line number in target is 3');
  }

  // 4. Deletions only
  console.log('📌 Test 4: Deletions Only');
  {
    const textA = 'step 1\nstep 2\nstep 3\nstep 4';
    const textB = 'step 1\nstep 4';
    const res = computeLineDiff(textA, textB);
    assert(res.deletions === 2, 'Detects exactly 2 deletions');
    assert(res.additions === 0, 'Detects 0 additions');
    assert(res.unchanged === 2, 'Detects 2 unchanged lines');

    const deletedLines = res.unified.filter((l) => l.type === 'removed');
    assert(deletedLines[0].content === 'step 2', 'First deleted line is step 2');
    assert(deletedLines[1].content === 'step 3', 'Second deleted line is step 3');
    assert(deletedLines[0].lineNumA === 2, 'Deleted lineNumA matches original position');
  }

  // 5. Modifications (Replacement of contiguous lines)
  console.log('📌 Test 5: Modifications & Contiguous Pairing');
  {
    const textA = 'function oldCode() {\n  return false;\n}';
    const textB = 'function newCode() {\n  return true;\n}';
    const res = computeLineDiff(textA, textB);
    assert(res.deletions === 2, 'Detects 2 deleted lines in modified function');
    assert(res.additions === 2, 'Detects 2 added lines in modified function');
    assert(res.unchanged === 1, 'Closing brace is unchanged');

    // Verify side-by-side pairing
    const pairedRow = res.sideBySide.find((r) => r.left?.type === 'removed' && r.right?.type === 'added');
    assert(Boolean(pairedRow), 'Side-by-side paired removed line with added line');
  }

  // 6. Windows CRLF vs Unix LF normalization
  console.log('📌 Test 6: Line Ending Normalization');
  {
    const crlfText = 'Title\r\nSection A\r\nEnd\r\n';
    const lfText = 'Title\nSection A\nEnd\n';
    const res = computeLineDiff(crlfText, lfText);
    assert(res.additions === 0 && res.deletions === 0, 'CRLF and LF produce identical diff with 0 changes');
  }

  // 7. ADR Markdown Document Diff Simulation
  console.log('📌 Test 7: Architectural Decision Record (ADR) Comparison');
  {
    const v1 = `# ADR-043: Messaging System
Status: Proposed
Context: Need event bus for billing.
Decision: Use RabbitMQ.
Consequences: Requires broker cluster.`;

    const v2 = `# ADR-043: Messaging System
Status: Accepted
Context: Need high-performance event bus for billing and sagas.
Decision: Use NATS JetStream 2.10.
Consequences: Ultra-low latency, built-in KV store, simplified operations.`;

    const res = computeLineDiff(v1, v2);
    assert(res.deletions === 4, 'ADR v1 -> v2 correctly calculates 4 replaced/deleted lines');
    assert(res.additions === 4, 'ADR v1 -> v2 correctly calculates 4 new/added lines');
    assert(res.unchanged === 1, 'Header line # ADR-043 remains unchanged');
  }

  console.log(`\n📊 DiffUtils Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
