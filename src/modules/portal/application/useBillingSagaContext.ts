import { useState, useEffect, useCallback } from 'react';
import {
  RefundSaga,
  RefundSagaProps,
  RefundSagaCompletedEvent,
  SagaStepDetail,
} from '../domain/billing/model';
import { Money } from '../domain/common/types';
import { billingRepository } from '../infrastructure/repositories/billingRepository';
import { portalEventBus } from '../infrastructure/eventBus';
import { OrderRefundRequestedPayload } from '../domain/orders/model';

export function useBillingSagaContext() {
  const [sagas, setSagas] = useState<RefundSaga[]>(() => billingRepository.getAllSagas());
  const [activeSagaId, setActiveSagaId] = useState<string>(() => sagas[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const refresh = useCallback(() => {
    setSagas([...billingRepository.getAllSagas()]);
  }, []);

  const activeSaga = sagas.find((s) => s.id === activeSagaId) || sagas[0];

  // Auto-listen to OrderRefundRequested from Orders Context
  useEffect(() => {
    const unsubscribe = portalEventBus.subscribe<OrderRefundRequestedPayload>(
      'OrderRefundRequested',
      (event) => {
        executeNewSaga(
          event.payload.orderId,
          event.payload.orderNumber,
          event.payload.amount,
          event.payload.reason
        );
      }
    );
    return unsubscribe;
  }, []);

  const executeNewSaga = useCallback(
    (orderId: string, orderNumber: string, amount: number, reason: string) => {
      const newSagaId = `saga-ref-${Math.floor(10000 + Math.random() * 90000)}`;
      const initialSteps: SagaStepDetail[] = [
        {
          id: 'VALIDATE_REQUEST',
          title: 'Валидация бизнес-правил заказа',
          service: 'order-service',
          status: 'RUNNING',
          message: `Проверка лимита возврата ${new Money(amount).format()}`,
        },
        {
          id: 'ACQUIRER_CALL',
          title: 'Запрос на возврат в банк (Эквайер)',
          service: 'billing-service -> Bank API',
          status: 'PENDING',
          message: 'Подготовка платёжного шлюза',
        },
        {
          id: 'LEDGER_ADJUSTMENT',
          title: 'Проводка в Главной книге (Ledger)',
          service: 'accounting-service',
          status: 'PENDING',
          message: 'Корректировка субсчетов выручки',
        },
        {
          id: 'JETSTREAM_EVENT',
          title: 'Публикация события в orders.v1.refund',
          service: 'nats-jetstream',
          status: 'PENDING',
          message: 'Stream: ORDERS, Subject: orders.v1.refund, ack: explicit',
        },
        {
          id: 'CLIENT_NOTIFICATION',
          title: 'Уведомление клиента (Email + SMS)',
          service: 'notification-service',
          status: 'PENDING',
          message: 'Шаблон REFUND_SUCCESSFUL_V2',
        },
      ];

      const newSagaProps: RefundSagaProps = {
        id: newSagaId,
        orderId,
        orderNumber,
        amount: new Money(amount),
        reason,
        initiator: 'Иван Петров (Архитектор)',
        currentStepIndex: 0,
        status: 'PROCESSING',
        steps: initialSteps,
        startedAt: new Date().toLocaleTimeString(),
      };

      const saga = new RefundSaga(newSagaProps);
      billingRepository.saveSaga(saga);
      setActiveSagaId(newSagaId);
      refresh();
      setIsModalOpen(true);
      setIsExecuting(true);

      // Simulate Step-by-Step Distributed Saga Orchestration
      const delays = [800, 1000, 700, 600, 600];
      const latencies = [42, 380, 85, 1, 64];

      let currentStep = 0;

      const runNext = () => {
        if (currentStep < 5) {
          setTimeout(() => {
            saga.advanceStep(currentStep, latencies[currentStep]);
            billingRepository.saveSaga(saga);
            refresh();
            currentStep++;

            if (currentStep < 5) {
              runNext();
            } else {
              setIsExecuting(false);
              // Publish Saga Completed Domain Event into NATS JetStream Event Mesh
              portalEventBus.publish(
                new RefundSagaCompletedEvent({
                  sagaId: newSagaId,
                  orderId,
                  amount,
                  jetstreamSubject: 'orders.v1.refund',
                  kafkaTopic: 'orders.v1.refund',
                })
              );
            }
          }, delays[currentStep]);
        }
      };

      runNext();
    },
    [refresh]
  );

  return {
    sagas,
    activeSaga,
    activeSagaId,
    setActiveSagaId,
    isModalOpen,
    setIsModalOpen,
    isExecuting,
    executeNewSaga,
  };
}
