import { useState, useEffect, useCallback } from 'react';
import { Order, OrderRefundRequestedEvent } from '../domain/orders/model';
import { orderRepository } from '../infrastructure/repositories/orderRepository';
import { portalEventBus } from '../infrastructure/eventBus';
import { RefundSagaCompletedPayload } from '../domain/billing/model';

export function useOrdersContext() {
  const [orders, setOrders] = useState<Order[]>(() => orderRepository.getAll());

  // Reload orders helper
  const refresh = useCallback(() => {
    setOrders([...orderRepository.getAll()]);
  }, []);

  // Listen to Saga completion domain events from Billing context
  useEffect(() => {
    const unsubscribe = portalEventBus.subscribe<RefundSagaCompletedPayload>(
      'RefundSagaCompleted',
      (event) => {
        const order = orderRepository.findById(event.payload.orderId);
        if (order) {
          order.completeRefund();
          orderRepository.save(order);
          refresh();
        }
      }
    );
    return unsubscribe;
  }, [refresh]);

  const requestRefund = useCallback(
    (orderId: string, amount: number, reason: string) => {
      const order = orderRepository.findById(orderId);
      if (!order) return;

      order.startRefund();
      orderRepository.save(order);
      refresh();

      // Publish domain event for Billing Context
      portalEventBus.publish(
        new OrderRefundRequestedEvent({
          orderId: order.id,
          orderNumber: order.number,
          amount,
          reason,
        })
      );
    },
    [refresh]
  );

  return {
    orders,
    requestRefund,
    refresh,
  };
}
