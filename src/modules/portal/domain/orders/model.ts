import { Money, DomainEvent } from '../common/types';

export type OrderStatus = 'PAID' | 'PENDING' | 'CANCELLED' | 'REFUNDED';
export type OrderRefundState = 'NONE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: Money;
}

export interface OrderProps {
  id: string;
  number: string;
  clientName: string;
  total: Money;
  status: OrderStatus;
  refundState: OrderRefundState;
  refundProgress?: number;
  items: OrderItem[];
  createdAt: string;
}

export class Order {
  constructor(private props: OrderProps) {}

  get id(): string {
    return this.props.id;
  }

  get number(): string {
    return this.props.number;
  }

  get clientName(): string {
    return this.props.clientName;
  }

  get total(): Money {
    return this.props.total;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get refundState(): OrderRefundState {
    return this.props.refundState;
  }

  get refundProgress(): number | undefined {
    return this.props.refundProgress;
  }

  get items(): OrderItem[] {
    return [...this.props.items];
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  public canInitiateRefund(): boolean {
    return (
      this.props.status === 'PAID' &&
      (this.props.refundState === 'NONE' || this.props.refundState === 'FAILED')
    );
  }

  public startRefund(): void {
    if (!this.canInitiateRefund()) {
      throw new Error(`Невозможно оформить возврат для заказа ${this.props.number} со статусом ${this.props.status}`);
    }
    this.props.refundState = 'PROCESSING';
    this.props.refundProgress = 30;
  }

  public completeRefund(): void {
    this.props.refundState = 'COMPLETED';
    this.props.status = 'REFUNDED';
    this.props.refundProgress = 100;
  }

  public toJSON(): OrderProps {
    return { ...this.props };
  }
}

export interface OrderRefundRequestedPayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string;
}

export class OrderRefundRequestedEvent implements DomainEvent<OrderRefundRequestedPayload> {
  readonly eventId = `evt-ord-ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  readonly eventName = 'OrderRefundRequested';
  readonly occurredAt = new Date();

  constructor(public readonly payload: OrderRefundRequestedPayload) {}
}
