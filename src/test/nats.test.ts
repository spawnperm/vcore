/**
 * Comprehensive Automated Tests for NATS 2.10 & JetStream Service Layer
 */

import { matchSubject, NatsService, natsService } from '../services/nats/natsService';
import { DomainEventBus } from '../modules/portal/infrastructure/eventBus';

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

export async function runNatsTestSuite(): Promise<{ passed: number; failed: number }> {
  console.log('⚡ Testing NATS Core, JetStream, Key-Value & Event Mesh Engine');
  passed = 0;
  failed = 0;

  const nats = new NatsService();

  // 1. Subject pattern matching with wildcards
  assert(matchSubject('orders.v1.created', 'orders.v1.created'), 'Exact subject match');
  assert(!matchSubject('orders.v1.created', 'orders.v2.created'), 'Exact subject mismatch');
  assert(matchSubject('orders.*.created', 'orders.v1.created'), 'Single token wildcard (*) matches');
  assert(!matchSubject('orders.*.created', 'orders.v1.beta.created'), 'Single token wildcard (*) does not cross dots');
  assert(matchSubject('billing.>', 'billing.saga.refund.step1'), 'Multi-token trailing wildcard (>) matches deep hierarchy');
  assert(matchSubject('billing.>', 'billing.saga'), 'Multi-token trailing wildcard (>) matches 1 trailing token');
  assert(matchSubject('>', 'anything.at.all'), 'Root wildcard (>) matches all');

  // 2. Pub / Sub functionality
  let receivedMsg: any = null;
  const sub1 = nats.subscribe('orders.*.created', (msg) => {
    receivedMsg = msg;
  });

  nats.publish('orders.v1.created', { orderId: 'ORD-TEST-1', total: 9900 });
  assert(receivedMsg !== null, 'Subscriber received published message');
  assert(receivedMsg?.data?.orderId === 'ORD-TEST-1', 'Message payload delivered intact');
  assert(receivedMsg?.subject === 'orders.v1.created', 'Message contains correct subject');

  // 3. Subscription isolation and unsubscription
  let ignoredMsg: any = null;
  const sub2 = nats.subscribe('billing.>', (msg) => {
    ignoredMsg = msg;
  });

  nats.publish('orders.v2.created', { orderId: 'ORD-TEST-2' });
  assert(ignoredMsg === null, 'Unrelated subscriber did not receive out-of-scope message');

  nats.unsubscribe(sub1.sid);
  receivedMsg = null;
  nats.publish('orders.v1.created', { orderId: 'ORD-TEST-3' });
  assert(receivedMsg === null, 'Unsubscribed client no longer receives messages');

  // 4. JetStream Stream Storage and Sequence Assignment
  const orderStreamBefore = nats.getStream('ORDERS');
  const initialLastSeq = orderStreamBefore?.state.lastSeq || 0;

  nats.publish('orders.v1.created', { orderId: 'ORD-JETSTREAM-1', amount: 45000 });
  const orderStreamAfter = nats.getStream('ORDERS');
  assert(
    orderStreamAfter !== undefined && orderStreamAfter.state.lastSeq === initialLastSeq + 1,
    'JetStream sequence incremented upon matching stream subject'
  );

  const streamMsgs = nats.getStreamMessages('ORDERS', 5);
  assert(streamMsgs.length > 0, 'JetStream retains published stream messages');
  assert(streamMsgs[0].data.orderId === 'ORD-JETSTREAM-1', 'Latest message at top of stream buffer');

  // 5. Key-Value (KV) Store Operations
  const put1 = nats.kvPut('saga-state', 'saga-unit-test-1', {
    status: 'INITIALIZED',
    amount: 15000,
  });
  assert(put1.revision === 1, 'First KV entry gets revision 1');

  const put2 = nats.kvPut('saga-state', 'saga-unit-test-1', {
    status: 'EXECUTING_COMPENSATION',
    amount: 15000,
  });
  assert(put2.revision === 2, 'Subsequent KV update gets revision 2');

  const getEntry = nats.kvGet('saga-state', 'saga-unit-test-1');
  assert(getEntry?.value?.status === 'EXECUTING_COMPENSATION', 'KV get returns latest revision value');

  const history = nats.kvGetHistory('saga-state', 'saga-unit-test-1');
  assert(history.length === 2, 'KV history tracks full revision audit trail');

  const keys = nats.kvListKeys('saga-state');
  assert(keys.includes('saga-unit-test-1'), 'KV listKeys includes updated key');

  // 6. Request-Reply Pattern (RPC)
  const rpcReply = await nats.request('billing.refund.validate', {
    sagaId: 'saga-rpc-test',
    amount: 14200,
  });
  assert(rpcReply?.approved === true, 'Request-Reply RPC receives simulated microservice response');
  assert(rpcReply?.maxRefundAmount === 14200, 'RPC reply contains expected domain data');

  // 7. DomainEventBus bridge to NATS
  const eventBus = new DomainEventBus();
  let natsReceivedEvent: any = null;
  natsService.subscribe('portal.events.TestNatsBridgedEvent', (msg) => {
    natsReceivedEvent = msg;
  });

  eventBus.publish({
    eventId: 'evt-nats-bridge-1',
    eventName: 'TestNatsBridgedEvent',
    occurredAt: new Date(),
    payload: { sagaId: 'saga-bridge-77', status: 'SUCCESS' },
  });

  assert(natsReceivedEvent !== null, 'DomainEventBus automatically bridges events to NATS');
  assert(
    natsReceivedEvent?.data?.payload?.sagaId === 'saga-bridge-77',
    'NATS received bridged domain event with full payload'
  );

  return { passed, failed };
}
