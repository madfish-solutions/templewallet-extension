import { isTruthy, createQueue } from './index';

/** See: https://developer.mozilla.org/en-US/docs/Glossary/Falsy */
const ALL_FALSY_VALUES = [false, 0, -0, BigInt(0), '', NaN, null, undefined];

const SOME_TRUTHY_VALUES = [123, '123', true, {}, Infinity];

describe('isTruthy', () => {
  it("should return `false` for all 'falsy' values", () => {
    expect(ALL_FALSY_VALUES.some(val => isTruthy(val))).toEqual(false);
  });

  it("should return `true` for all 'truthy' values", () => {
    expect(SOME_TRUTHY_VALUES.every(val => isTruthy(val))).toEqual(true);
  });
});

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
