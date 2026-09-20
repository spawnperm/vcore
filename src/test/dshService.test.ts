/**
 * Unit Tests for DeepSeek Harness (DSH) Service & Gateway
 * Tests dshService functions and fallback handlers
 */

import { fetchDshStatus, executeDshCommand, streamAudioOrTextToGeminiFlash } from '../services/dshService.ts';

export async function runDshServiceTestSuite(): Promise<{ passed: number; failed: number }> {
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

  console.log('🤖 Starting DSH Service & Gateway Unit Tests...');

  // 1. DSH Status Retrieval & Fallback
  console.log('📌 Test 1: DSH Gateway Status');
  {
    const status = await fetchDshStatus();
    assert(status.gateway === 'deepseek-harness', 'Status reports gateway deepseek-harness');
    assert(typeof status.version === 'string' && status.version.length > 0, 'Status reports non-empty version');
    assert(status.liveApi.model.includes('gemini'), 'Status liveApi model targets gemini');
    assert(Array.isArray(status.capabilities), 'Status capabilities is an array');
    assert(status.capabilities.includes('ast_patching'), 'Capabilities include ast_patching');
    assert(status.capabilities.includes('saga_verification'), 'Capabilities include saga_verification');
  }

  // 2. DSH Command Execution (AST & Patch Verification)
  console.log('📌 Test 2: DSH Command Execution');
  {
    const commandText = 'Добавить проверку лимитов эквайринга в сагу возврата';
    const result = await executeDshCommand(commandText, { role: 'developer' }, {}, false);

    assert(result.gateway === 'deepseek-harness', 'Command returns deepseek-harness gateway');
    assert(result.llm.includes('gemini'), 'Command returns gemini model');
    assert(typeof result.explanation === 'string' && result.explanation.length > 0, 'Command returns explanation');
    assert(Array.isArray(result.dshPlan) && result.dshPlan.length > 0, 'Command returns dshPlan steps');
    assert(Boolean(result.patch && result.patch.diff), 'Command synthesizes code diff patch');
    assert(Array.isArray(result.tests) && result.tests.length > 0, 'Command runs simulated verification tests');
    assert(result.tests.every((t) => t.status === 'PASSED'), 'All synthesized tests pass invariants');
    assert(!result.isVoiceInput, 'isVoiceInput flag preserved as false');

    // Test with voice input flag
    const voiceResult = await executeDshCommand('Голосовая команда', {}, {}, true);
    assert(voiceResult.isVoiceInput === true, 'isVoiceInput flag preserved as true');
  }

  // 3. DSH Streaming Fallback Simulation
  console.log('📌 Test 3: DSH Streaming Audio & Text');
  {
    let receivedChunk = false;
    let receivedStatus = false;
    let receivedResult = false;

    const streamResult = await streamAudioOrTextToGeminiFlash({
      text: 'Интегрировать NATS JetStream в модуль биллинга',
      onChunk: (chunk) => {
        if (chunk) receivedChunk = true;
      },
      onStatus: (status) => {
        if (status) receivedStatus = true;
      },
      onResult: (res) => {
        if (res.gateway === 'deepseek-harness') receivedResult = true;
      },
    });

    assert(receivedStatus, 'Streaming invoked onStatus callback');
    assert(receivedChunk, 'Streaming invoked onChunk callback');
    assert(receivedResult, 'Streaming invoked onResult callback');
    assert(typeof streamResult.fullText === 'string' && streamResult.fullText.length > 0, 'Stream returns fullText');
    assert(Boolean(streamResult.dshResult?.patch), 'Stream result contains generated patch');
  }

  console.log(`\n📊 DSH Service Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
