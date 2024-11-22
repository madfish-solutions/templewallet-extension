import { Listener, ListenerCallback } from './listener';

export abstract class ListenersDelegate<T extends unknown[] = []> {
  constructor(protected listeners: Listener<T>[]) {}

  subscribe(callback: ListenerCallback<T>) {
    this.listeners.forEach(listener => listener.subscribe(callback));
  }

  unsubscribe(callback: ListenerCallback<T>) {
    this.listeners.forEach(listener => listener.unsubscribe(callback));
  }
}
