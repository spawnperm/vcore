/**
 * Automated Unit & Domain Tests for Mirovizor (vcore)
 * Executed by CI/CD and local npm test command
 */

import { RefundSaga, RefundSagaProps } from '../modules/portal/domain/billing/model.ts';
import { Money } from '../modules/portal/domain/common/types.ts';
import { DomainEventBus } from '../modules/portal/infrastructure/eventBus.ts';
import { orderRepository } from '../modules/portal/infrastructure/repositories/orderRepository.ts';
import { billingRepository } from '../modules/portal/infrastructure/repositories/billingRepository.ts';
import { procurementRepository } from '../modules/portal/infrastructure/repositories/procurementRepository.ts';
import { salesRepository } from '../modules/portal/infrastructure/repositories/salesRepository.ts';
import { runPlanTabGraphTestSuite } from './planTabGraph.test.ts';
import { runStorageTestSuite } from './storage.test.ts';
import { runNatsTestSuite } from './nats.test.ts';
import { runNocoBaseTestSuite } from './nocobase.test.ts';

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

async function runTests() {
  console.log('🧪 Starting Mirovizor Test Suite...\n');

  // Test 1: RefundSaga Lifecycle and State Machine
  console.log('📦 Testing Domain Model: RefundSaga');
  const initialSagaData: RefundSagaProps = {
    id: 'test-saga-1',
    orderId: 'order-101',
    orderNumber: '#РОМ-9402',
    amount: new Money(15400),
    reason: 'Брак товара на складе',
    initiator: 'Менеджер продаж',
    currentStepIndex: 0,
    status: 'PROCESSING',
    startedAt: new Date().toISOString(),
    steps: [
      { id: 'VALIDATE_REQUEST', title: 'Проверка прав', service: 'Auth', status: 'RUNNING' },
      { id: 'ACQUIRER_CALL', title: 'Вызов эквайринга', service: 'Bank', status: 'PENDING' },
      { id: 'LEDGER_ADJUSTMENT', title: 'Сторнирование', service: 'Ledger', status: 'PENDING' },
      { id: 'JETSTREAM_EVENT', title: 'Публикация в NATS JetStream', service: 'Broker', status: 'PENDING' },
      { id: 'CLIENT_NOTIFICATION', title: 'SMS уведомление', service: 'Notify', status: 'PENDING' },
    ],
  };

  const saga = new RefundSaga(initialSagaData);
  assert(saga.status === 'PROCESSING', 'Saga starts in PROCESSING state');
  assert(saga.currentStep?.id === 'VALIDATE_REQUEST', 'First step is VALIDATE_REQUEST');

  saga.advanceStep(0, 12);
  assert(saga.steps[0].status === 'COMPLETED', 'Step 0 marked as COMPLETED');
  assert(saga.steps[1].status === 'RUNNING', 'Step 1 transitioned to RUNNING');

  saga.advanceStep(1, 45);
  saga.advanceStep(2, 30);
  saga.advanceStep(3, 10);
  saga.advanceStep(4, 18);
  assert(saga.status === 'COMPLETED', 'Saga completes after all steps succeed');
  assert(saga.steps[4].status === 'COMPLETED', 'Final notification step is COMPLETED');

  // Test 2: DomainEventBus Publish & Subscribe
  console.log('\n📡 Testing Infrastructure: DomainEventBus');
  const bus = new DomainEventBus();
  let receivedEvent: boolean = false;
  let eventPayload: any = null;

  bus.subscribe('TestOrderEvent', (event) => {
    receivedEvent = true;
    eventPayload = event.payload;
  });

  bus.publish({
    eventId: 'evt-1',
    eventName: 'TestOrderEvent',
    occurredAt: new Date(),
    payload: { orderId: 'ord-55', total: 4200 },
  });

  assert(receivedEvent, 'EventBus dispatches event to subscriber');
  assert(eventPayload?.orderId === 'ord-55', 'EventBus delivers correct event payload');

  // Test 3: Repositories CRUD Operations
  console.log('\n🗄️ Testing Repositories: Orders, Billing, Procurement & Sales');
  const allOrders = orderRepository.getAll();
  assert(allOrders.length > 0, 'OrderRepository loads initial orders');

  const firstOrder = allOrders[0];
  const orderById = orderRepository.findById(firstOrder.id);
  assert(orderById?.id === firstOrder.id, 'OrderRepository findById matches');

  const allSagas = billingRepository.getAllSagas();
  assert(allSagas.length > 0, 'BillingRepository initializes with sagas');

  const suppliers = procurementRepository.getSuppliers();
  assert(suppliers.length > 0, 'ProcurementRepository returns suppliers');

  const clients = salesRepository.getClients();
  assert(clients.length > 0, 'SalesRepository returns clients');

  // Test 4: PlanTab Dependency Graph & Critical Path Engine
  console.log('\n');
  runPlanTabGraphTestSuite();

  // Test 5: LocalStorage Synchronization & State Recovery Engine
  console.log('\n');
  runStorageTestSuite();

  // Test 6: NATS 2.10 JetStream & Event Mesh Engine
  console.log('\n');
  const natsRes = await runNatsTestSuite();
  passed += natsRes.passed;
  failed += natsRes.failed;

  // Test 7: NocoBase Architecture: Custom Collections, Fields & UI-Schema Engine
  console.log('\n');
  runNocoBaseTestSuite();

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
