import { act, useEffect } from 'react';

import type { LiFiStep } from '@lifi/sdk';
import { createRoot, Root } from 'react-dom/client';

import {
  getAlchemyCallsStatus,
  prepareAlchemyCalls,
  sendAlchemyCalls
} from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import { buildAlchemySwapCalls } from 'lib/evm/alchemy/swap';
import type { AlchemyPreparedOperation, AlchemySignedCalls } from 'lib/evm/alchemy/types';
import { useTempleClient } from 'lib/temple/front';
import type { EvmChain } from 'temple/front';

import { useAlchemySwapBatch } from './useAlchemySwapBatch';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  AlchemyRpcError: class AlchemyRpcError extends Error {
    constructor(
      readonly code: number,
      message: string
    ) {
      super(message);
    }
  },
  getAlchemyCallsStatus: jest.fn(),
  prepareAlchemyCalls: jest.fn(),
  sendAlchemyCalls: jest.fn()
}));
jest.mock('lib/evm/alchemy/swap', () => ({ buildAlchemySwapCalls: jest.fn() }));
jest.mock('lib/evm/alchemy/validation', () => ({
  ALCHEMY_FEE_MULTIPLIERS: { slow: 0.7, mid: 0.85, fast: 1 },
  ALCHEMY_QUOTE_LIFETIME: 60_000,
  addAlchemyGasParamsOverride: (request: object, feeOption: string) => ({
    ...request,
    capabilities: {
      eip7702Auth: {
        delegation: 'ModularAccountV2',
        version: 'v1.1.0'
      },
      gasParamsOverride: {
        maxFeePerGas: { multiplier: feeOption === 'slow' ? 0.7 : feeOption === 'mid' ? 0.85 : 1 },
        maxPriorityFeePerGas: { multiplier: feeOption === 'slow' ? 0.7 : feeOption === 'mid' ? 0.85 : 1 }
      }
    }
  }),
  validateAlchemyPreparedCalls: jest.fn(),
  getAlchemyMaxFee: () => 100n,
  getAlchemyOperation: (value: unknown) => value
}));
jest.mock('lib/temple/front', () => ({ useTempleClient: jest.fn() }));
jest.mock('lib/utils', () => ({ delay: () => Promise.resolve() }));
jest.mock('lib/browser', () => ({
  browser: { storage: { local: { get: jest.fn(), set: jest.fn(), remove: jest.fn() } } }
}));

const account = '0x1111111111111111111111111111111111111111';
const network = { chainId: 1, currency: { decimals: 18 } } as EvmChain;
const steps = [{ id: 'route' }] as LiFiStep[];
const prepared: AlchemyPreparedOperation = {
  type: 'user-operation-v070',
  chainId: '0x1',
  data: {
    sender: account,
    nonce: '0x10',
    callData: '0x',
    callGasLimit: '0x1',
    verificationGasLimit: '0x1',
    preVerificationGas: '0x1',
    maxFeePerGas: '0x1',
    maxPriorityFeePerGas: '0x1'
  },
  signatureRequest: { type: 'personal_sign', data: { raw: '0x00' } }
};
const signed: AlchemySignedCalls = {
  type: 'user-operation-v070',
  chainId: '0x1',
  data: prepared.data,
  signature: { type: 'secp256k1', data: '0x1234' }
};
const sign = jest.fn();
const prepare = prepareAlchemyCalls as jest.Mock;
const send = sendAlchemyCalls as jest.Mock;
const status = getAlchemyCallsStatus as jest.Mock;
let current: ReturnType<typeof useAlchemySwapBatch>;
let root: Root;
let container: HTMLDivElement;
let stored: Record<string, unknown>;

function Harness() {
  const result = useAlchemySwapBatch({ steps, account, network });
  useEffect(() => {
    current = result;
  }, [result]);
  return null;
}

async function mount(): Promise<void> {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<Harness />);
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  stored = {};
  const storage = browser.storage.local;
  (storage.get as jest.Mock).mockImplementation(async () => JSON.parse(JSON.stringify(stored)));
  (storage.set as jest.Mock).mockImplementation(async value => {
    Object.assign(stored, JSON.parse(JSON.stringify(value)));
  });
  (storage.remove as jest.Mock).mockImplementation(async key => {
    delete stored[key];
  });
  (useTempleClient as jest.Mock).mockReturnValue({ signAlchemyBatch: sign });
  (buildAlchemySwapCalls as jest.Mock).mockResolvedValue({ calls: [{ to: account, value: '0x0', data: '0x' }], steps });
  prepare.mockResolvedValue(prepared);
  sign.mockResolvedValue(signed);
  send.mockResolvedValue({ id: '0xaaa' });
  status.mockResolvedValue({
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash: '0xbbb' }]
  });
  await mount();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('uses one confirmation signature request and returns the final transaction hash', async () => {
  let hash;
  await act(async () => {
    hash = await current.execute();
  });
  expect(hash).toBe('0xbbb');
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
  expect(status).toHaveBeenCalledWith('0xaaa');
});

it('prepares the selected fee multiplier', async () => {
  expect(prepare).toHaveBeenLastCalledWith(
    expect.objectContaining({
      capabilities: {
        eip7702Auth: {
          delegation: 'ModularAccountV2',
          version: 'v1.1.0'
        },
        gasParamsOverride: {
          maxFeePerGas: { multiplier: 0.85 },
          maxPriorityFeePerGas: { multiplier: 0.85 }
        }
      }
    }),
    expect.any(AbortSignal)
  );
  await act(async () => current.selectFeeOption('fast'));
  expect(prepare).toHaveBeenLastCalledWith(
    expect.objectContaining({
      capabilities: {
        eip7702Auth: {
          delegation: 'ModularAccountV2',
          version: 'v1.1.0'
        },
        gasParamsOverride: {
          maxFeePerGas: { multiplier: 1 },
          maxPriorityFeePerGas: { multiplier: 1 }
        }
      }
    }),
    expect.any(AbortSignal)
  );
});

it('scales the fee preview from the selected multiplier', () => {
  expect(current.feeOptions).toEqual({
    slow: '0.000000000000000083',
    mid: '0.0000000000000001',
    fast: '0.000000000000000118'
  });
});

it('keeps the current quote visible while a new fee prepares', async () => {
  let resolvePreparation: SyncFn<AlchemyPreparedOperation>;
  const pendingPreparation = new Promise<AlchemyPreparedOperation>(resolve => {
    resolvePreparation = resolve;
  });
  prepare.mockReturnValueOnce(pendingPreparation);
  const initialQuote = current.quote;

  await act(async () => current.selectFeeOption('fast'));

  expect(current.busy).toBe(true);
  expect(current.quote).toBe(initialQuote);
  expect(current.selectedFeeOption).toBe('fast');
  expect(buildAlchemySwapCalls).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolvePreparation(prepared);
    await pendingPreparation;
  });

  expect(current.busy).toBe(false);
  expect(current.quote?.feeOption).toBe('fast');
});

it('aborts fee preparation when the confirmation closes', async () => {
  prepare.mockReturnValueOnce(new Promise(() => undefined));
  await act(async () => current.selectFeeOption('fast'));
  const signal = prepare.mock.calls[prepare.mock.calls.length - 1][1] as AbortSignal;

  await act(async () => root.unmount());

  expect(signal.aborted).toBe(true);
  container.remove();
  await mount();
});

it('refreshes an expired fee quote without a signature', async () => {
  current.quote!.expiresAt = Date.now() - 1;
  await act(async () => {
    await current.execute();
  });
  expect(sign).not.toHaveBeenCalled();
  expect(prepare).toHaveBeenCalledTimes(2);
});

it('reuses the signed operation after a lost send response and popup closure', async () => {
  send.mockRejectedValueOnce(new Error('Lost response'));
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('Lost response');
  });
  expect(Object.keys(stored)).toHaveLength(1);
  await act(async () => root.unmount());
  container.remove();
  await mount();
  expect(current.submitted).toBe(true);
  await act(async () => {
    expect(await current.execute()).toBe('0xbbb');
  });
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toEqual(send.mock.calls[1][0]);
});

it('discards a definitively rejected operation without a call ID', async () => {
  const { AlchemyRpcError } = jest.requireMock('lib/apis/temple/endpoints/evm/alchemy-wallet');
  send.mockRejectedValue(new AlchemyRpcError(-32507, 'invalid account signature'));
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('invalid account signature');
  });
  expect(current.submitted).toBe(false);
  expect(stored).toEqual({});
});

it('reviews a replacement quote before a second signature and tracks both call IDs', async () => {
  status.mockResolvedValue({ chainId: '0x1', status: 100 });
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('pending');
  });
  await act(async () => {
    expect(await current.execute()).toBeUndefined();
  });
  expect(sign).toHaveBeenCalledTimes(1);
  send.mockResolvedValue({ id: '0xccc' });
  status.mockImplementation(async id =>
    id === '0xaaa'
      ? { chainId: '0x1', status: 100 }
      : { chainId: '0x1', atomic: true, status: 200, receipts: [{ status: '0x1', transactionHash: '0xddd' }] }
  );
  await act(async () => {
    expect(await current.execute()).toBe('0xddd');
  });
  expect(sign).toHaveBeenCalledTimes(2);
  expect(status).toHaveBeenCalledWith('0xaaa');
  expect(status).toHaveBeenCalledWith('0xccc');
});

it('does not replace a batch that completes before Retry', async () => {
  status.mockResolvedValueOnce({ chainId: '0x1', status: 100 }).mockRejectedValueOnce(new Error('Status unavailable'));
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('Status unavailable');
  });
  status.mockResolvedValue({
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash: '0xbbb' }]
  });
  await act(async () => {
    expect(await current.execute()).toBe('0xbbb');
  });
  expect(sign).toHaveBeenCalledTimes(1);
});

it('keeps recovery data for partial or unknown statuses', async () => {
  status.mockResolvedValue({ chainId: '0x1', status: 600 });
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('partial or unknown');
  });
  expect(current.submitted).toBe(true);
  expect(Object.keys(stored)).toHaveLength(1);
  expect(sign).toHaveBeenCalledTimes(1);
});

it('rejects a replacement quote with a new nonce', async () => {
  status.mockResolvedValue({ chainId: '0x1', status: 100 });
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('pending');
  });
  prepare.mockResolvedValueOnce({ ...prepared, data: { ...prepared.data, nonce: '0x11' } });
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('nonce changed');
  });
  expect(sign).toHaveBeenCalledTimes(1);
});

it('releases a fully failed batch for a fresh quote', async () => {
  status.mockResolvedValue({ chainId: '0x1', status: 500 });
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('failed');
  });
  expect(current.submitted).toBe(false);
  expect(stored).toEqual({});
  await act(async () => {
    await current.execute();
  });
  expect(sign).toHaveBeenCalledTimes(1);
  expect(prepare).toHaveBeenCalledTimes(2);
});
