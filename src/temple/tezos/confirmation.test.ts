import type { TezosToolkit } from '@taquito/taquito';

import {
  confirmTezosOperation,
  TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG,
  TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG
} from './confirmation';

describe('confirmTezosOperation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts tracking from the supplied block hash', async () => {
    const confirmation = jest.fn().mockResolvedValue({ completed: true });
    const createOperation = jest.fn().mockResolvedValue({ confirmation });
    const tezos = { operation: { createOperation } } as unknown as TezosToolkit;

    await confirmTezosOperation(tezos, 'operation-hash', {
      startingBlockHash: 'starting-block-hash',
      timeoutMs: 30_000,
      confirmations: 2
    });

    expect(createOperation).toHaveBeenCalledWith('operation-hash', {
      blockIdentifier: 'starting-block-hash'
    });
    expect(confirmation).toHaveBeenCalledWith(2);
  });

  it('rejects when Taquito returns no confirmation', async () => {
    const confirmation = jest.fn().mockResolvedValue(undefined);
    const tezos = {
      operation: { createOperation: jest.fn().mockResolvedValue({ confirmation }) }
    } as unknown as TezosToolkit;

    await expect(
      confirmTezosOperation(tezos, 'operation-hash', {
        startingBlockHash: 'starting-block-hash',
        timeoutMs: 30_000
      })
    ).rejects.toThrow(TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG);
  });

  it('rejects after the supplied timeout', async () => {
    const tezos = {
      operation: {
        createOperation: jest.fn().mockResolvedValue({ confirmation: () => new Promise(() => undefined) })
      }
    } as unknown as TezosToolkit;
    const result = confirmTezosOperation(tezos, 'operation-hash', {
      startingBlockHash: 'starting-block-hash',
      timeoutMs: 12_000
    });

    jest.advanceTimersByTime(12_000);

    await expect(result).rejects.toThrow(TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG);
  });
});
