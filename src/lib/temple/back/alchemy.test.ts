import { getAlchemyCallsStatus, sendAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import { getAlchemySubmissionKey } from 'lib/evm/alchemy/submission';
import { account, makeQuote, makeStep, makeSubmission } from 'lib/evm/alchemy/test-fixtures';
import { getViemPublicClient } from 'temple/evm';
import type { EvmChain } from 'temple/front';

let recovery: typeof import('./alchemy');

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  ...jest.requireActual('lib/apis/temple/endpoints/evm/alchemy-wallet'),
  getAlchemyCallsStatus: jest.fn(),
  sendAlchemyCalls: jest.fn()
}));
jest.mock('temple/evm', () => ({ getViemPublicClient: jest.fn() }));
jest.mock('lib/browser', () => ({
  browser: {
    storage: { local: { get: jest.fn(), set: jest.fn(), remove: jest.fn() } }
  }
}));
const network = { chainId: 1 } as EvmChain;
const readContract = jest.fn();
const getBalance = jest.fn();
const sign = jest.fn();
const send = sendAlchemyCalls as jest.MockedFunction<typeof sendAlchemyCalls>;
const status = getAlchemyCallsStatus as jest.MockedFunction<typeof getAlchemyCallsStatus>;
let storage: Record<string, unknown>;
const key = getAlchemySubmissionKey(account, 1);
beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  jest.isolateModules(() => {
    recovery = jest.requireActual('./alchemy');
  });
  storage = {};
  (browser.storage.local.get as jest.Mock).mockImplementation(async (requested?: string) =>
    requested ? { [requested]: storage[requested] } : storage
  );
  (browser.storage.local.set as jest.Mock).mockImplementation(async value => {
    Object.assign(storage, JSON.parse(JSON.stringify(value)));
  });
  (getViemPublicClient as unknown as jest.Mock).mockReturnValue({ readContract, getBalance });
  getBalance.mockResolvedValue(5n);
  readContract.mockResolvedValue(60n);
  const record = makeSubmission();
  sign.mockResolvedValue(record.attempts[0].signed);
  send.mockResolvedValue({ id: record.attempts[0].id });
  status.mockResolvedValue({ id: record.attempts[0].id, chainId: '0x1', atomic: true, status: 100 });
});
afterEach(() => jest.useRealTimers());
it('uses the EntryPoint deposit before the account balance', async () => {
  const record = await recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign);
  expect(record.attempts[0].state).toBe('pending');
  expect(sign).toHaveBeenCalledTimes(1);
});
it('rejects an insufficient combined balance before a signature', async () => {
  readContract.mockResolvedValue(59n);
  await expect(recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign)).rejects.toThrow(
    'Insufficient balance'
  );
  expect(sign).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
it('does not allow EntryPoint deposits to fund call values', async () => {
  getBalance.mockResolvedValue(4n);
  readContract.mockResolvedValue(1_000_000n);
  await expect(recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign)).rejects.toThrow(
    'Insufficient balance'
  );
});
it('serializes concurrent popup submissions and signs only once', async () => {
  const quote = makeQuote();
  await Promise.all([
    recovery.submitAlchemyBatch(account, network, quote, [makeStep()], sign),
    recovery.submitAlchemyBatch(account, network, quote, [makeStep()], sign)
  ]);
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
});
it('does not overwrite an ambiguous submission', async () => {
  const record = makeSubmission();
  record.attempts[0].state = 'unknown';
  storage[key] = record;
  status.mockRejectedValueOnce(new Error('Unavailable'));
  await expect(recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign)).rejects.toThrow(
    'unresolved'
  );
  expect(sign).not.toHaveBeenCalled();
  expect(storage[key]).toMatchObject({ attempts: [{ state: 'unknown' }] });
});
it('restores a completed submission at worker startup without alarms or another signature', async () => {
  const record = makeSubmission();
  record.attempts[0].state = 'pending';
  storage[key] = record;
  const transactionHash = `0x${'ab'.repeat(32)}` as const;
  status.mockResolvedValue({
    id: record.attempts[0].id,
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash }]
  });
  await recovery.startAlchemyRecovery();
  expect(storage[key]).toMatchObject({ version: 2, result: { status: 'confirmed', transactionHash } });
  expect(sign).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it('does not let an old popup delete a newer pending submission', async () => {
  storage[key] = makeSubmission();
  await expect(recovery.completeAlchemyBatch(account, 1, `0x${'ab'.repeat(32)}`)).rejects.toThrow('unresolved');
  expect(browser.storage.local.remove).not.toHaveBeenCalled();
});
it('clears only the confirmed transaction that the popup consumed', async () => {
  const transactionHash = `0x${'ab'.repeat(32)}` as const;
  storage[key] = { ...makeSubmission(), result: { status: 'confirmed', transactionHash } };
  await recovery.completeAlchemyBatch(account, 1, transactionHash);
  expect(browser.storage.local.remove).toHaveBeenCalledWith(key);
});

it('continues status checks with a background timer after the popup closes', async () => {
  const record = await recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign);
  const transactionHash = `0x${'ab'.repeat(32)}` as const;
  status.mockResolvedValue({
    id: record.attempts[0].id,
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash }]
  });
  const confirmed = new Promise<void>(resolve => {
    (browser.storage.local.set as jest.Mock).mockImplementation(async value => {
      Object.assign(storage, JSON.parse(JSON.stringify(value)));
      if (value[key]?.result?.status === 'confirmed') resolve();
    });
  });
  jest.advanceTimersByTime(3000);
  await confirmed;
  expect(storage[key]).toMatchObject({ result: { status: 'confirmed', transactionHash } });
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
});

it('restores status checks after worker termination without an alarm', async () => {
  const record = await recovery.submitAlchemyBatch(account, network, makeQuote(), [makeStep()], sign);
  // Worker termination discards timers and module state, but retains extension storage.
  jest.clearAllTimers();
  jest.isolateModules(() => {
    recovery = jest.requireActual('./alchemy');
  });
  const transactionHash = `0x${'cd'.repeat(32)}` as const;
  status.mockResolvedValue({
    id: record.attempts[0].id,
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash }]
  });
  jest.advanceTimersByTime(3000);
  await recovery.startAlchemyRecovery();
  expect(storage[key]).toMatchObject({ result: { status: 'confirmed', transactionHash } });
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
});
