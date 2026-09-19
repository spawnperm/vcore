import { Money, DomainEvent } from '../common/types';

export type SagaStepId =
  | 'VALIDATE_REQUEST'
  | 'ACQUIRER_CALL'
  | 'LEDGER_ADJUSTMENT'
  | 'KAFKA_EVENT'
  | 'CLIENT_NOTIFICATION';

export type SagaStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';

export interface SagaStepDetail {
  id: SagaStepId;
  title: string;
  service: string;
  status: SagaStepStatus;
  latencyMs?: number;
  message?: string;
}

export interface RefundSagaProps {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: Money;
  reason: string;
  initiator: string;
  currentStepIndex: number;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  steps: SagaStepDetail[];
  startedAt: string;
  completedAt?: string;
}

export class RefundSaga {
  constructor(private props: RefundSagaProps) {}

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get reason(): string {
    return this.props.reason;
  }

  get initiator(): string {
    return this.props.initiator;
  }

  get status(): 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED' {
    return this.props.status;
  }

  get steps(): SagaStepDetail[] {
    return [...this.props.steps];
  }

  get currentStep(): SagaStepDetail | undefined {
    return this.props.steps[this.props.currentStepIndex];
  }

  public advanceStep(stepIndex: number, latencyMs: number): void {
    if (stepIndex < this.props.steps.length) {
      this.props.steps[stepIndex].status = 'COMPLETED';
      this.props.steps[stepIndex].latencyMs = latencyMs;
      this.props.currentStepIndex = stepIndex + 1;

      if (this.props.currentStepIndex < this.props.steps.length) {
        this.props.steps[this.props.currentStepIndex].status = 'RUNNING';
      } else {
        this.props.status = 'COMPLETED';
        this.props.completedAt = new Date().toISOString();
      }
    }
  }

  public toJSON(): RefundSagaProps {
    return { ...this.props, steps: [...this.props.steps] };
  }
}

export interface RefundSagaCompletedPayload {
  sagaId: string;
  orderId: string;
  amount: number;
  kafkaTopic: string;
}

export class RefundSagaCompletedEvent implements DomainEvent<RefundSagaCompletedPayload> {
  readonly eventId = `evt-saga-comp-${Date.now()}`;
  readonly eventName = 'RefundSagaCompleted';
  readonly occurredAt = new Date();

  constructor(public readonly payload: RefundSagaCompletedPayload) {}
}
