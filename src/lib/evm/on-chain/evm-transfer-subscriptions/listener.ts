export type ListenerCallback<Args extends unknown[]> = (...args: Args) => void;

export abstract class Listener<Args extends unknown[] = []> {
  protected callbacks: ListenerCallback<Args>[] = [];

  subscribe(callback: ListenerCallback<Args>) {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: ListenerCallback<Args>) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  protected emit(...args: Args) {
    this.callbacks.forEach(callback => callback(...args));
  }
}
