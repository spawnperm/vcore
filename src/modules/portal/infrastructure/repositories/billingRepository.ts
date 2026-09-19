import { RefundSaga, RefundSagaProps } from '../../domain/billing/model';
import { Money } from '../../domain/common/types';

export interface IBillingRepository {
  getAllSagas(): RefundSaga[];
  findSagaById(id: string): RefundSaga | undefined;
  saveSaga(saga: RefundSaga): void;
}

const INITIAL_SAGAS: RefundSagaProps[] = [
  {
    id: 'saga-ref-77492',
    orderId: 'ord-1',
    orderNumber: '#ORD-98421',
    amount: new Money(14200),
    reason: 'Возврат товара покупателем надлежащего качества',
    initiator: 'Иван Петров (Архитектор)',
    currentStepIndex: 2,
    status: 'PROCESSING',
    startedAt: '2026-09-19 10:14:02',
    steps: [
      {
        id: 'VALIDATE_REQUEST',
        title: 'Валидация бизнес-правил заказа',
        service: 'order-service',
        status: 'COMPLETED',
        latencyMs: 38,
        message: 'Заказ #ORD-98421 проверен, статус PAID подтвержден',
      },
      {
        id: 'ACQUIRER_CALL',
        title: 'Запрос на возврат в банк (Эквайер)',
        service: 'billing-service -> Bank API',
        status: 'COMPLETED',
        latencyMs: 412,
        message: 'RRN: 9812401823, авторизационный код REF-OK',
      },
      {
        id: 'LEDGER_ADJUSTMENT',
        title: 'Проводка в Главной книге (Ledger)',
        service: 'accounting-service',
        status: 'RUNNING',
        latencyMs: 95,
        message: 'Сторнирование выручки и восстановление баланса клиента',
      },
      {
        id: 'KAFKA_EVENT',
        title: 'Публикация события в payments.refund',
        service: 'event-broker-kafka',
        status: 'PENDING',
        message: 'Топик payments.refund, партиция #2',
      },
      {
        id: 'CLIENT_NOTIFICATION',
        title: 'Уведомление клиента (Email + Push)',
        service: 'notification-service',
        status: 'PENDING',
        message: 'Шаблон REFUND_SUCCESSFUL_V2',
      },
    ],
  },
  {
    id: 'saga-ref-77490',
    orderId: 'ord-4',
    orderNumber: '#ORD-98418',
    amount: new Money(32500),
    reason: 'Брак при транспортировке (Акт №194)',
    initiator: 'Анна Васильева',
    currentStepIndex: 5,
    status: 'COMPLETED',
    startedAt: '2026-09-16 09:20:00',
    completedAt: '2026-09-16 09:20:08',
    steps: [
      { id: 'VALIDATE_REQUEST', title: 'Валидация бизнес-правил', service: 'order-service', status: 'COMPLETED', latencyMs: 24 },
      { id: 'ACQUIRER_CALL', title: 'Эквайер возврат', service: 'billing-service', status: 'COMPLETED', latencyMs: 310 },
      { id: 'LEDGER_ADJUSTMENT', title: 'Проводка бухгалтерского баланса', service: 'accounting-service', status: 'COMPLETED', latencyMs: 78 },
      { id: 'KAFKA_EVENT', title: 'Публикация события Kafka', service: 'event-broker-kafka', status: 'COMPLETED', latencyMs: 14 },
      { id: 'CLIENT_NOTIFICATION', title: 'Отправка чека возврата клиенту', service: 'notification-service', status: 'COMPLETED', latencyMs: 92 },
    ],
  },
];

class InMemoryBillingRepository implements IBillingRepository {
  private sagas: Map<string, RefundSaga> = new Map();

  constructor() {
    INITIAL_SAGAS.forEach((data) => {
      this.sagas.set(data.id, new RefundSaga(data));
    });
  }

  public getAllSagas(): RefundSaga[] {
    return Array.from(this.sagas.values());
  }

  public findSagaById(id: string): RefundSaga | undefined {
    return this.sagas.get(id);
  }

  public saveSaga(saga: RefundSaga): void {
    this.sagas.set(saga.id, saga);
  }
}

export const billingRepository: IBillingRepository = new InMemoryBillingRepository();
