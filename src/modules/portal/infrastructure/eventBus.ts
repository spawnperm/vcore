import { DomainEvent } from '../domain/common/types';
import { nats } from '../../../services/nats/natsService';

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
    // 1. Dispatch to local domain subscribers
    const handlers = this.handlers.get(event.eventName) || [];
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`Error in event handler for ${event.eventName}:`, err);
      }
    });

    // 2. Publish to NATS JetStream Event Mesh under portal.events.*
    try {
      nats.publish(`portal.events.${event.eventName}`, event);
    } catch (natsErr) {
      console.warn('Could not mirror domain event to NATS:', natsErr);
    }
  }
}

export const portalEventBus = new DomainEventBus();

