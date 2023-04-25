import { PartialObserver } from 'rxjs';

type EventFn<T, K = void> = (event: T) => K;
type EventFnPromisable<T, K = void> = (event: T) => Promise<K>;

export const rxJsTestingHelper = <T>(
  callback: EventFn<T> | EventFnPromisable<T>,
  done: jest.DoneCallback
): PartialObserver<T> => ({
  next: async data => {
    try {
      await callback(data);

      done();
    } catch (e) {
      done(e);
    }
  },
  error: e => done(e)
});
