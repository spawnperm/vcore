import { DomainEvent } from '../domain/common/types';

type EventHandler<T = any> = (event: DomainEvent<T>) => void;

export class DomainEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  public subscribe<T = any>(eventName: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler);

    return () => {
      const current = this.handlers.get(eventName) || [];
      this.handlers.set(
        eventName,
        current.filter((h) => h !== handler)
      );
    };
  }

  public publish<T = any>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.eventName) || [];
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`Error in event handler for ${event.eventName}:`, err);
      }
    });
  }
}

export const portalEventBus = new DomainEventBus();
