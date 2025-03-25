/**
* A singleton for managing events across the entire app
* Get an instance of the EventHub using `EventHub.getInstance()`, not `new EventHub()`
*/
export class EventHub {
  events: Record<string, Function[]>;
  static instance: EventHub | null = null;

  constructor() {
    this.events = {};
  }

  // Subscribe to an event
  subscribe(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    // Return an unsubscribe function for convenience
    return () => this.unsubscribe(event, listener);
  }

  // Publish an event
  publish(event: string, data: any) {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(data));
  }

  // Unsubscribe from an event
  unsubscribe(event: string, listenerToRemove: Function) {
    if (!this.events[event]) return;

    // Filter out the listener that should be removed
    this.events[event] = this.events[event].filter(
      (listener) => listener !== listenerToRemove,
    );
  }

  // Get an instance of the EventHub
  static getInstance(): EventHub {
    if (!EventHub.instance) {
      EventHub.instance = new EventHub();
    }
    return EventHub.instance;
  }
}
