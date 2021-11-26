import { createQueue } from './queue';

describe('Queue', () => {
  it('queue', async () => {
    const enqueue = createQueue();

    const result: number[] = [];
    await Promise.all([
      enqueue(() =>
        withDelay(300, () => {
          result.push(1);
        })
      ),
      enqueue(() =>
        withDelay(200, () => {
          result.push(2);
        })
      ),
      enqueue(() =>
        withDelay(100, () => {
          result.push(3);
        })
      ),
      enqueue(() =>
        withDelay(0, () => {
          result.push(4);
        })
      )
    ]);

    expect(result).toStrictEqual([1, 2, 3, 4]);
  });
});

async function withDelay(ms: number, factory: () => any) {
  await new Promise(r => setTimeout(r, ms));
  return factory();
}
