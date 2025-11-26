import { Injectable } from '@nestjs/common';
import { IDomainEvent } from './domain-events';

// Event handler interface
export interface IEventHandler<T extends IDomainEvent> {
  handle(event: T): Promise<void>;
}

// Event bus service implementing Observer pattern
@Injectable()
export class EventBusService {
  private readonly handlers: Map<string, Set<IEventHandler<any>>> = new Map();

  // Subscribe handler to specific event
  subscribe<T extends IDomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }

  // Unsubscribe handler from event
  unsubscribe<T extends IDomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.delete(handler);
    }
  }

  // Publish event to all subscribers
  async publish(event: IDomainEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName);
    if (!eventHandlers || eventHandlers.size === 0) {
      return;
    }

    // Execute all handlers in parallel
    const handlerPromises = Array.from(eventHandlers).map((handler) =>
      handler.handle(event).catch((error) => {
        console.error(`Error handling event ${event.eventName}:`, error);
      }),
    );

    await Promise.all(handlerPromises);
  }
}
