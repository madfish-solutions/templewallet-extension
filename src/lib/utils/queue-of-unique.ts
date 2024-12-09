import { Mutex } from 'async-mutex';
import { isEqual } from 'lodash';

export class QueueOfUnique<T> {
  private data: T[] = [];
  private mutex = new Mutex();

  constructor(private equalityFn: (a: T, b: T) => boolean = isEqual) {}

  length() {
    return this.mutex.runExclusive(() => this.data.length);
  }

  pop() {
    return this.mutex.runExclusive(() => this.data.shift());
  }

  push(element: T) {
    return this.mutex.runExclusive(() => {
      if (this.data.some(e => this.equalityFn(e, element))) {
        return false;
      }

      this.data.push(element);

      return true;
    });
  }
}
