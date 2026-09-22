import { AlchemyRpcError, getAlchemyCallsStatus, sendAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';

import { getAlchemyCheckDelay, reconcileAlchemySubmission } from './recovery';
import type { AlchemySubmission } from './submission';
import { makeSubmission } from './test-fixtures';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  ...jest.requireActual('lib/apis/temple/endpoints/evm/alchemy-wallet'),
  getAlchemyCallsStatus: jest.fn(),
  sendAlchemyCalls: jest.fn()
}));
const status = getAlchemyCallsStatus as jest.MockedFunction<typeof getAlchemyCallsStatus>;
const send = sendAlchemyCalls as jest.MockedFunction<typeof sendAlchemyCalls>;
let record: AlchemySubmission;
let saves: AlchemySubmission[];
const save = async (next: AlchemySubmission): Promise<void> => {
  saves.push(JSON.parse(JSON.stringify(next)));
};
const transactionHash = `0x${'ab'.repeat(32)}` as const;
function pending() {
  return { id: record.attempts[0].id, chainId: '0x1' as const, atomic: true, status: 100 };
}
beforeEach(() => {
  jest.resetAllMocks();
  record = makeSubmission();
  saves = [];
  send.mockResolvedValue({ id: record.attempts[0].id });
  status.mockResolvedValue(pending());
});
it('persists the uncertain state before the first network send', async () => {
  send.mockImplementationOnce(async () => {
    expect(saves[0].attempts[0].state).toBe('unknown');
    return { id: record.attempts[0].id };
  });
  const result = await reconcileAlchemySubmission(record, save);
  expect(result.attempts[0].state).toBe('pending');
  expect(status).not.toHaveBeenCalled();
});
it('retains a lost response followed by AA25 and later finds the completed operation', async () => {
  send.mockRejectedValueOnce(new Error('Connection lost'));
  record = await reconcileAlchemySubmission(record, save);
  expect(record.attempts[0].state).toBe('unknown');
  status.mockResolvedValueOnce({ ...pending(), status: 400 });
  send.mockRejectedValueOnce(new AlchemyRpcError(-32500, 'AA25 invalid account nonce'));
  record = await reconcileAlchemySubmission(record, save, true);
  expect(record.result).toBeUndefined();
  expect(record.attempts).toHaveLength(1);
  expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  status.mockResolvedValueOnce({ ...pending(), status: 200, receipts: [{ status: '0x1', transactionHash }] });
  record = await reconcileAlchemySubmission(record, save, true);
  expect(record.result).toEqual({ status: 'confirmed', transactionHash });
  expect(send).toHaveBeenCalledTimes(2);
});
it('releases a definitive rejection on the first send', async () => {
  send.mockRejectedValueOnce(new AlchemyRpcError(-32000, 'precheck failed: maxFeePerGas too low'));
  expect((await reconcileAlchemySubmission(record, save)).result).toEqual({ status: 'failed' });
});
it('does not interpret a rate limit as a definitive rejection', async () => {
  send.mockRejectedValueOnce(new AlchemyRpcError(429, 'Alchemy rate limit reached'));
  record = await reconcileAlchemySubmission(record, save);
  expect(record.result).toBeUndefined();
  expect(record.attempts[0].nextCheckAt).toBeGreaterThan(Date.now());
});
it('respects persisted backoff after restart', async () => {
  record.attempts[0].state = 'pending';
  record.attempts[0].nextCheckAt = Date.now() + 60_000;
  await reconcileAlchemySubmission(record, save);
  expect(status).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
  expect(saves).toHaveLength(0);
});
it('skips terminal attempts and checks the replacement', async () => {
  const failed = { ...record.attempts[0], state: 'failed' as const };
  record.attempts = [failed, { ...record.attempts[0], state: 'pending' }];
  await reconcileAlchemySubmission(record, save, true);
  expect(status).toHaveBeenCalledTimes(1);
});
it('retains partial and unknown statuses', async () => {
  record.attempts[0].state = 'pending';
  status.mockResolvedValueOnce({ ...pending(), status: 600 });
  const result = await reconcileAlchemySubmission(record, save);
  expect(result.result).toBeUndefined();
  expect(result.error?.message).toContain('partial or unknown');
});
it('releases an operation that fails on-chain', async () => {
  record.attempts[0].state = 'pending';
  status.mockResolvedValueOnce({ ...pending(), status: 500 });
  expect((await reconcileAlchemySubmission(record, save)).result).toEqual({ status: 'failed' });
});
it('rejects a status for another chain', async () => {
  record.attempts[0].state = 'pending';
  status.mockResolvedValueOnce({ ...pending(), chainId: '0xa' });
  const result = await reconcileAlchemySubmission(record, save);
  expect(result.result).toBeUndefined();
  expect(result.error?.message).toContain('identity');
});
it('caps exponential backoff at one minute', () => {
  expect([0, 1, 2, 3, 4, 5, 100].map(getAlchemyCheckDelay)).toEqual([3000, 6000, 12000, 24000, 48000, 60000, 60000]);
});
it('replays the original signature when its status is not found after restart', async () => {
  record.attempts[0].state = 'unknown';
  status.mockRejectedValueOnce(new AlchemyRpcError(-32602, 'Call not found'));
  const result = await reconcileAlchemySubmission(record, save);
  expect(send).toHaveBeenCalledWith(record.attempts[0].signed);
  expect(result.attempts[0].state).toBe('pending');
});
it('replays an unacknowledged signature even when a hash lookup returns pending', async () => {
  record.attempts[0].state = 'unknown';
  const result = await reconcileAlchemySubmission(record, save);
  expect(send).toHaveBeenCalledWith(record.attempts[0].signed);
  expect(result.attempts[0].state).toBe('pending');
});
