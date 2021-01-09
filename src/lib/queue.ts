export function createQueue() {
  let worker: Promise<any> = Promise.resolve();
  return <T>(factory: () => Promise<T>): Promise<T> =>
    (worker = worker.then(() => factory()));
}
