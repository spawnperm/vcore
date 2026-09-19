// Domain Common: Value Objects and Domain Event interfaces

export interface ValueObject<T> {
  equals(other: ValueObject<T>): boolean;
}

export class Money implements ValueObject<number> {
  constructor(
    public readonly amount: number,
    public readonly currency: 'RUB' | 'USD' | 'EUR' = 'RUB'
  ) {}

  public format(): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: 0,
    }).format(this.amount);
  }

  public equals(other: ValueObject<number>): boolean {
    if (!(other instanceof Money)) return false;
    return this.amount === other.amount && this.currency === other.currency;
  }
}

export interface DomainEvent<TPayload = any> {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly payload: TPayload;
}
