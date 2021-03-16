export function createQueue() {
  let worker: Promise<any> = Promise.resolve();
  return <T>(factory: () => Promise<T>): Promise<T> =>
    new Promise((res, rej) => {
      worker = worker.then(() => factory().then(res).catch(rej));
    });
}
