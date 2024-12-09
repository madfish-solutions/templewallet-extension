import { isDefined } from '@rnw-community/shared';
import { Mutex } from 'async-mutex';
import { omit } from 'lodash';

import { EVM_RPC_REQUESTS_INTERVAL } from 'lib/fixed-times';
import { QueueOfUnique } from 'lib/utils/queue-of-unique';

export class RequestAlreadyPendingError extends Error {}

export interface ExecutionQueueCallbacks<R> {
  onSuccess: SyncFn<R>;
  onError: SyncFn<Error>;
}

type Payload<T extends ExecutionQueueCallbacks<R>, R> = Omit<T, 'onSuccess' | 'onError'>;

export abstract class EvmRpcRequestsExecutor<T extends ExecutionQueueCallbacks<R>, R, K extends string | number> {
  private requestsQueues = new Map<K, QueueOfUnique<T>>();
  private mapMutex = new Mutex();
  private requestInterval: NodeJS.Timer;

  constructor() {
    this.executeNextRequests = this.executeNextRequests.bind(this);
    this.requestInterval = setInterval(() => this.executeNextRequests(), EVM_RPC_REQUESTS_INTERVAL);
  }

  protected abstract getQueueKey(payload: Payload<T, R>): K;
  protected abstract requestsAreSame(a: Payload<T, R>, b: Payload<T, R>): boolean;
  protected abstract getResult(payload: Payload<T, R>): Promise<R>;

  async queueIsEmpty(key: K) {
    return this.mapMutex.runExclusive(async () => {
      const queue = this.requestsQueues.get(key);
      return !queue || (await queue.length()) === 0;
    });
  }

  async executeRequest(payload: Payload<T, R>) {
    const chainId = this.getQueueKey(payload);

    return new Promise<R>(async (resolve, reject) => {
      const queue = await this.mapMutex.runExclusive(async () => {
        let result = this.requestsQueues.get(chainId);
        if (!result) {
          result = new QueueOfUnique<T>((a, b) =>
            this.requestsAreSame(omit(a, 'onSuccess', 'onError'), omit(b, 'onSuccess', 'onError'))
          );
          this.requestsQueues.set(chainId, result);
        }

        return result;
      });

      const hasBeenPushed = await queue.push({
        ...payload,
        onSuccess: resolve,
        onError: reject
      } as T);

      if (!hasBeenPushed) {
        reject(new RequestAlreadyPendingError());
      }
    });
  }

  finalize() {
    clearInterval(this.requestInterval);
  }

  private async executeNextRequests() {
    const requests = await this.mapMutex.runExclusive(() => {
      const requestsPromises: Promise<T | undefined>[] = [];
      this.requestsQueues.forEach(queue => requestsPromises.push(queue.pop()));

      return Promise.all(requestsPromises).then(requests => requests.filter(isDefined));
    });

    return Promise.all(
      requests.map(async ({ onSuccess, onError, ...payload }) => {
        try {
          const result = await this.getResult(payload);
          onSuccess(result);
        } catch (err: any) {
          onError(err);
        }
      })
    );
  }
}
