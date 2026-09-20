/**
 * Unit Tests for Portal Core Domain Models & Repositories
 * Tests Money, Order, RefundSaga, and Domain Event Bus
 */

import { Money } from '../modules/portal/domain/common/types.ts';
import { Order, OrderRefundRequestedEvent } from '../modules/portal/domain/orders/model.ts';
import { RefundSaga, RefundSagaCompletedEvent } from '../modules/portal/domain/billing/model.ts';
import { orderRepository } from '../modules/portal/infrastructure/repositories/orderRepository.ts';
import { billingRepository } from '../modules/portal/infrastructure/repositories/billingRepository.ts';
import { procurementRepository } from '../modules/portal/infrastructure/repositories/procurementRepository.ts';
import { salesRepository } from '../modules/portal/infrastructure/repositories/salesRepository.ts';

export function runDomainCoreTestSuite(): { passed: number; failed: number } {
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

  console.log('🏛️ Starting Portal Core Domain & Repositories Unit Tests...');

  // 1. Money Value Object
  console.log('📌 Test 1: Money Value Object Invariants');
  {
    const m1 = new Money(5000, 'RUB');
    const m2 = new Money(5000, 'RUB');
    const m3 = new Money(7500, 'RUB');
    const m4 = new Money(5000, 'USD');

    assert(m1.amount === 5000, 'Money retains exact numeric amount');
    assert(m1.currency === 'RUB', 'Money retains currency');
    assert(m1.equals(m2), 'Money equals identical amount and currency');
    assert(!m1.equals(m3), 'Money does not equal different amount');
    assert(!m1.equals(m4), 'Money does not equal different currency');
    assert(typeof m1.format() === 'string', 'Money format returns localized string');
    assert(m1.format().length > 0, 'Formatted string is non-empty');
  }

  // 2. Order Aggregate Root Lifecycle
  console.log('📌 Test 2: Order Aggregate Root Invariants');
  {
    const testOrder = new Order({
      id: 'test-ord-500',
      number: '#РОМ-5001',
      clientName: 'ООО СеверТранс',
      total: new Money(98000),
      status: 'PAID',
      refundState: 'NONE',
      items: [
        { id: 'item-1', name: 'Серверный шкаф 42U', quantity: 2, price: new Money(49000) },
      ],
      createdAt: '2026-03-01T10:00:00Z',
    });

    assert(testOrder.canInitiateRefund(), 'Paid order with refundState NONE can initiate refund');

    testOrder.startRefund();
    assert(testOrder.refundState === 'PROCESSING', 'startRefund sets state to PROCESSING');
    assert(testOrder.refundProgress === 30, 'startRefund sets initial progress to 30%');
    assert(!testOrder.canInitiateRefund(), 'Order in PROCESSING cannot initiate another refund');

    // Attempting startRefund while PROCESSING must throw
    let errorThrown = false;
    try {
      testOrder.startRefund();
    } catch {
      errorThrown = true;
    }
    assert(errorThrown, 'startRefund throws when refund is already active');

    testOrder.completeRefund();
    assert(testOrder.status === 'REFUNDED', 'completeRefund updates order status to REFUNDED');
    assert(testOrder.refundState === 'COMPLETED', 'completeRefund updates refundState to COMPLETED');
    assert(testOrder.refundProgress === 100, 'completeRefund sets progress to 100%');

    // JSON serialization
    const serialized = testOrder.toJSON();
    assert(serialized.id === 'test-ord-500', 'toJSON preserves order ID');
    assert(serialized.status === 'REFUNDED', 'toJSON reflects mutated status');
  }

  // 3. Domain Events
  console.log('📌 Test 3: Domain Event Dispatches');
  {
    const event = new OrderRefundRequestedEvent({
      orderId: 'ord-99',
      orderNumber: '#РОМ-99',
      amount: 45000,
      reason: 'Клиент отказался от поставки',
    });

    assert(event.eventName === 'OrderRefundRequested', 'Event name is OrderRefundRequested');
    assert(event.payload.orderId === 'ord-99', 'Event preserves order ID');
    assert(event.occurredAt instanceof Date, 'Event has valid occurredAt timestamp');
    assert(event.eventId.startsWith('evt-ord-ref-'), 'Event has unique eventId prefix');

    const compEvent = new RefundSagaCompletedEvent({
      sagaId: 'saga-01',
      orderId: 'ord-99',
      amount: 45000,
      jetstreamSubject: 'portal.events.billing.refund.completed',
    });
    assert(compEvent.eventName === 'RefundSagaCompleted', 'Event name is RefundSagaCompleted');
    assert(compEvent.payload.jetstreamSubject.includes('billing.refund'), 'Subject includes billing.refund event path');
  }

  // 4. RefundSaga Step Validation & JSON Invariance
  console.log('📌 Test 4: RefundSaga Invariance');
  {
    const saga = new RefundSaga({
      id: 'saga-sub-1',
      orderId: 'ord-88',
      orderNumber: '#РОМ-88',
      amount: new Money(12000),
      reason: 'Дефект сборки',
      initiator: 'Контроль Качества',
      currentStepIndex: 0,
      status: 'PROCESSING',
      startedAt: new Date().toISOString(),
      steps: [
        { id: 'VALIDATE_REQUEST', title: 'Шаг 1', service: 'Auth', status: 'RUNNING' },
        { id: 'ACQUIRER_CALL', title: 'Шаг 2', service: 'Bank', status: 'PENDING' },
      ],
    });

    assert(saga.steps.length === 2, 'Saga has 2 steps');
    assert(saga.currentStep?.id === 'VALIDATE_REQUEST', 'Current step is step 1');

    saga.advanceStep(0, 15);
    assert(saga.currentStep?.id === 'ACQUIRER_CALL', 'Current step advanced to step 2');
    assert(saga.steps[0].latencyMs === 15, 'Latency is recorded for step 0');

    saga.advanceStep(1, 40);
    assert(saga.status === 'COMPLETED', 'Saga status is COMPLETED');
    assert(saga.currentStep === undefined, 'No remaining step when completed');

    const json = saga.toJSON();
    assert(json.status === 'COMPLETED', 'toJSON serializes status');
    assert(json.steps[1].latencyMs === 40, 'toJSON preserves step latency');
  }

  // 5. Procurement Repository Operations
  console.log('📌 Test 5: Procurement Repository');
  {
    const suppliers = procurementRepository.getSuppliers();
    assert(suppliers.length >= 2, 'Procurement repository contains multiple seed suppliers');
    const firstSupplier = suppliers[0];
    assert(Boolean(firstSupplier.id && firstSupplier.name), 'Supplier has id and name');

    const inventory = procurementRepository.getInventory();
    assert(inventory.length >= 3, 'Procurement repository contains inventory items');

    const contracts = procurementRepository.getContracts();
    assert(contracts.length >= 1, 'Procurement repository contains contracts');
  }

  // 6. Sales Repository Operations
  console.log('📌 Test 6: Sales Repository');
  {
    const clients = salesRepository.getClients();
    assert(clients.length >= 3, 'Sales repository contains seed clients');
    const client = clients[0];
    assert(Boolean(client.id && client.name), 'Client has id and name');

    const deals = salesRepository.getDeals();
    assert(deals.length >= 3, 'Sales repository contains pipeline deals');
    const openDeal = deals.find((d) => d.stage !== 'won');
    assert(Boolean(openDeal), 'Sales repository contains active in-progress deals');
  }

  console.log(`\n📊 Domain Core Test Results: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}
