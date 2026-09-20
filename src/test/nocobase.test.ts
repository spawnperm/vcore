import { collectionRepository } from '../modules/nocobase/database/CollectionRepository';
import { screenRepository } from '../modules/nocobase/ui-schema/screenRepository';
import { nats } from '../services/nats/natsService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ [PASS] ${message}`);
}

export function runNocoBaseTestSuite(): void {
  console.log('🏛️ Testing NocoBase Architecture: Custom Collections, Fields & UI-Schema Engine...');

  // 1. Initial Collections Verification
  const initialCols = collectionRepository.getCollections();
  assert(initialCols.length >= 2, 'Initial collections loaded (support_tickets, security_audits)');

  const ticketsCol = collectionRepository.getCollection('support_tickets');
  assert(ticketsCol !== undefined, 'Found support_tickets collection');
  assert(
    ticketsCol!.fields.some((f) => f.name === 'amount' && f.type === 'money'),
    'support_tickets has money field "amount"'
  );
  assert(
    ticketsCol!.fields.some((f) => f.name === 'category' && f.type === 'select'),
    'support_tickets has select field "category"'
  );

  // 2. Records CRUD & NATS JetStream Event Emission
  let capturedNatsMsg: any = null;
  const sub = nats.subscribe('records.v1.support_tickets.created', (msg) => {
    capturedNatsMsg = msg;
  });

  const createdRecord = collectionRepository.createRecord('support_tickets', {
    ticket_number: 'TCK-999',
    client_name: 'ООО Рога и Копыта',
    amount: 150000,
    priority: 'high',
    status: 'new',
  });

  assert(Boolean(createdRecord.id), 'Record created with generated id');
  assert(createdRecord.ticket_number === 'TCK-999', 'Record fields preserved correctly');
  assert(capturedNatsMsg !== null, 'NATS JetStream received records.v1.support_tickets.created');
  assert(
    capturedNatsMsg?.data?.record?.ticket_number === 'TCK-999',
    'NATS event payload contains created record data'
  );
  nats.unsubscribe(sub.sid);

  // Record update
  const updatedRecord = collectionRepository.updateRecord('support_tickets', createdRecord.id, {
    status: 'in_progress',
    amount: 175000,
  });
  assert(updatedRecord.status === 'in_progress', 'Record field updated successfully');
  assert(updatedRecord.amount === 175000, 'Numeric amount updated');

  // Record deletion
  const deleted = collectionRepository.deleteRecord('support_tickets', createdRecord.id);
  assert(deleted === true, 'Record deleted from repository');
  const findDeleted = collectionRepository.getRecord('support_tickets', createdRecord.id);
  assert(findDeleted === undefined, 'Deleted record no longer queryable');

  // 3. Custom Collection & Field Creation (NocoBase Database Engine)
  const testColName = `col_test_${Date.now().toString(36)}`;
  const newCol = collectionRepository.createCollection({
    name: testColName,
    title: 'Тестовый реестр оборудования',
    description: 'Учет серверных стоек и коммутаторов',
    category: '🏢 Пользовательские справочники',
    icon: 'Server',
    fields: [
      { name: 'serial_no', title: 'Серийный номер', type: 'string', required: true },
      { name: 'purchase_price', title: 'Стоимость закупки', type: 'money' },
      {
        name: 'status',
        title: 'Статус оборудования',
        type: 'status',
        options: [
          { label: 'В работе', value: 'active', color: 'emerald' },
          { label: 'В ремонте', value: 'maintenance', color: 'amber' },
        ],
      },
    ],
  });

  assert(newCol.name === testColName, 'New dynamic collection created with custom fields');
  assert(newCol.fields.length >= 3, 'Custom fields registered in schema');

  // 4. Verify NATS Key-Value Store Sync
  const kvEntry = nats.kvGet('portal_schemas', `schema.${testColName}`);
  assert(kvEntry !== undefined, 'Schema synchronized to NATS KV Store "portal_schemas"');
  assert(
    (kvEntry?.value as any)?.title === 'Тестовый реестр оборудования',
    'KV value matches collection title'
  );

  // 5. Custom UI-Schema Screen Creation
  const newScreen = screenRepository.createScreen({
    id: `screen-${testColName}`,
    title: 'Оборудование ЦОД',
    section: '🏢 Пользовательские справочники',
    icon: 'Server',
    collectionName: testColName,
    isCustom: true,
    blocks: [
      {
        id: `blk-${testColName}-kpi`,
        type: 'metrics',
        title: 'Сводка по оборудованию',
        collectionName: testColName,
        visibleFields: [],
        metrics: [
          { id: 'm-cnt', label: 'Всего стоек', aggregationType: 'count', color: 'cyan' },
        ],
      },
      {
        id: `blk-${testColName}-tbl`,
        type: 'table',
        title: 'Список оборудования',
        collectionName: testColName,
        visibleFields: ['serial_no', 'purchase_price', 'status'],
        canAdd: true,
        canEdit: true,
        canDelete: true,
      },
    ],
  });

  assert(newScreen.id === `screen-${testColName}`, 'Custom screen created in screenRepository');
  assert(newScreen.blocks.length === 2, 'UI-Schema blocks registered correctly');

  const retrievedScreen = screenRepository.getScreen(`screen-${testColName}`);
  assert(retrievedScreen !== undefined, 'Screen retrieved successfully');
  assert(retrievedScreen?.blocks[0].type === 'metrics', 'First block is metrics');
  assert(retrievedScreen?.blocks[1].type === 'table', 'Second block is table');

  // Clean up test collection
  collectionRepository.deleteCollection(testColName);
  screenRepository.deleteScreen(`screen-${testColName}`);
  assert(collectionRepository.getCollection(testColName) === undefined, 'Test collection cleaned up');
  assert(screenRepository.getScreen(`screen-${testColName}`) === undefined, 'Test screen cleaned up');
}
