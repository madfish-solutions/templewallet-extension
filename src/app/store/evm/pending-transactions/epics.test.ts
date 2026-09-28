import type { Action } from 'redux';
import { StateObservable } from 'redux-observable';
import { Subject, Subscription } from 'rxjs';

import type { RootState } from 'app/store/root-state.type';
import { getAlchemyCallsStatus } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';

import { monitorPendingEvmBatchesAction, removePendingEvmBatchAction } from './actions';
import { monitorPendingEvmBatchesEpic, periodicBatchMonitorTriggerEpic } from './epics';
import type { PendingEvmBatch } from './state';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({ getAlchemyCallsStatus: jest.fn() }));
jest.mock('app/toaster', () => ({ toastError: jest.fn(), toastSuccess: jest.fn() }));
jest.mock('lib/ui/show-tx-submit-toast.util', () => ({ showTxSubmitToastWithDelay: jest.fn() }));

const callId = `0x${'aa'.repeat(64)}` as const;
const txHash = `0x${'bb'.repeat(32)}` as const;
const network = { chainId: 1, rpcBaseURL: 'https://example.com/rpc' };
const batch = {
  callId,
  batchKey: 'route',
  accountPkh: '0x1111111111111111111111111111111111111111',
  inputNetwork: network,
  outputNetwork: network,
  initialInputNetwork: network,
  blockExplorerBaseUrl: 'https://example.com',
  outputTokenSlug: 'output',
  initialInputTokenSlug: 'input',
  statusCheckParams: { fromChain: 1, toChain: 1, bridge: 'test', provider: 'lifi' },
  submittedAt: 123
} as PendingEvmBatch;
const status = getAlchemyCallsStatus as jest.MockedFunction<typeof getAlchemyCallsStatus>;

interface BatchMonitorHarness {
  output: Action[];
  check: () => void;
  setBatches: (batches: PendingEvmBatch[]) => void;
  close: () => void;
}

const startBatchMonitor = (batches: PendingEvmBatch[]): BatchMonitorHarness => {
  const action$ = new Subject<Action>();
  const stateInput$ = new Subject<RootState>();
  const createState = (pendingBatches: PendingEvmBatch[]): RootState =>
    ({
      pendingEvmTransactions: { batches: Object.fromEntries(pendingBatches.map(value => [value.callId, value])) }
    }) as RootState;
  const state$ = new StateObservable(stateInput$, createState(batches));
  const output: Action[] = [];
  const subscription = new Subscription();
  subscription.add(
    monitorPendingEvmBatchesEpic(action$, state$, undefined).subscribe(action => {
      output.push(action);
      if (removePendingEvmBatchAction.match(action)) {
        const pendingBatches = Object.values(state$.value.pendingEvmTransactions.batches);
        stateInput$.next(createState(pendingBatches.filter(value => value.callId !== action.payload)));
      }
    })
  );
  subscription.add(
    periodicBatchMonitorTriggerEpic(action$, state$, undefined).subscribe(action => action$.next(action))
  );
  return {
    output,
    check: () => action$.next(monitorPendingEvmBatchesAction()),
    setBatches: pendingBatches => stateInput$.next(createState(pendingBatches)),
    close: () => {
      subscription.unsubscribe();
      action$.complete();
      stateInput$.complete();
    }
  };
};

const checkBatch = async (): Promise<Action[]> => {
  const monitor = startBatchMonitor([batch]);
  monitor.check();
  await new Promise(resolve => setTimeout(resolve, 500));
  monitor.close();
  return monitor.output;
};

beforeEach(() => jest.resetAllMocks());

it('keeps a pending call ID for the next status check', async () => {
  status.mockResolvedValue({ id: callId, chainId: '0x1', atomic: true, status: 100 });
  expect(await checkBatch()).toEqual([]);
  expect(status).toHaveBeenCalledWith(callId);
});

it('moves a successful call ID to the transaction hash monitor', async () => {
  status.mockResolvedValue({
    id: callId,
    chainId: '0x1',
    atomic: true,
    status: 200,
    receipts: [{ status: '0x1', transactionHash: txHash }]
  });
  const actions = await checkBatch();
  expect(actions.map(action => action.type)).toEqual([
    'evm/pending-transactions/ADD_SWAP',
    'evm/pending-transactions/REMOVE_BATCH',
    'evm/pending-transactions/MONITOR_SWAP'
  ]);
  expect(actions[0]).toMatchObject({ payload: { txHash, batchKey: batch.batchKey } });
});

it('removes a terminal failed batch', async () => {
  status.mockResolvedValue({ id: callId, chainId: '0x1', atomic: true, status: 400 });
  expect(await checkBatch()).toEqual([{ type: 'evm/pending-transactions/REMOVE_BATCH', payload: callId }]);
});

it('keeps an invalid status identity for investigation', async () => {
  status.mockResolvedValue({ id: '0x1234', chainId: '0x1', atomic: true, status: 200 });
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  expect(await checkBatch()).toEqual([]);
  jest.restoreAllMocks();
});

describe('batch status schedule', () => {
  let monitor: BatchMonitorHarness;

  const advanceTime = async (milliseconds: number): Promise<void> => {
    for (let elapsed = 0; elapsed < milliseconds; elapsed += 100) {
      jest.advanceTimersByTime(Math.min(100, milliseconds - elapsed));
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    status.mockResolvedValue({ id: callId, chainId: '0x1', atomic: true, status: 100 });
    monitor = startBatchMonitor([{ ...batch, submittedAt: 0 }]);
  });

  afterEach(() => {
    monitor.close();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('waits 500 milliseconds before the first status check', async () => {
    await advanceTime(125);
    monitor.check();
    monitor.check();
    expect(status).not.toHaveBeenCalled();
    await advanceTime(499);
    expect(status).not.toHaveBeenCalled();
    await advanceTime(1);
    expect(status).toHaveBeenCalledTimes(1);
  });

  it('skips a delayed check if the batch is removed', async () => {
    monitor.check();
    monitor.setBatches([]);
    await advanceTime(500);
    expect(status).not.toHaveBeenCalled();
    expect(monitor.output).toEqual([]);
  });

  it('checks every half second for 5 seconds, then doubles the interval up to 30 seconds', async () => {
    const checkTimes: number[] = [];
    status.mockImplementation(async () => {
      checkTimes.push(Date.now());
      return { id: callId, chainId: '0x1', atomic: true, status: 100 };
    });
    monitor.check();
    await Promise.resolve();
    await advanceTime(96_000);
    expect(checkTimes).toEqual([
      ...Array.from({ length: 10 }, (_, index) => (index + 1) * 500),
      6_000,
      8_000,
      12_000,
      20_000,
      36_000,
      66_000,
      96_000
    ]);
  });

  it('delays a new batch by 500 milliseconds while another batch waits for backoff', async () => {
    monitor.check();
    await Promise.resolve();
    await advanceTime(6_500);
    const previousChecks = status.mock.calls.length;
    const secondBatch: PendingEvmBatch = { ...batch, callId: '0x1234', submittedAt: Date.now() };
    status.mockResolvedValue({ id: secondBatch.callId, chainId: '0x1', atomic: true, status: 100 });
    monitor.setBatches([{ ...batch, submittedAt: 0 }, secondBatch]);
    monitor.check();
    await Promise.resolve();
    expect(status.mock.calls.slice(previousChecks)).toEqual([]);
    await advanceTime(500);
    expect(status.mock.calls.slice(previousChecks)).toEqual([[secondBatch.callId]]);
    await advanceTime(500);
    expect(status.mock.calls.slice(previousChecks)).toEqual([[secondBatch.callId], [secondBatch.callId]]);
  });

  it('prevents overlapping requests without blocking another batch', async () => {
    status.mockReturnValueOnce(new Promise(() => undefined));
    monitor.check();
    await advanceTime(2_000);
    expect(status).toHaveBeenCalledTimes(1);
    const secondBatch: PendingEvmBatch = { ...batch, callId: '0x1234', submittedAt: Date.now() };
    status.mockResolvedValue({ id: secondBatch.callId, chainId: '0x1', atomic: true, status: 100 });
    monitor.setBatches([{ ...batch, submittedAt: 0 }, secondBatch]);
    monitor.check();
    await Promise.resolve();
    expect(status.mock.calls).toEqual([[callId]]);
    await advanceTime(500);
    expect(status.mock.calls).toEqual([[callId], [secondBatch.callId]]);
    await advanceTime(500);
    expect(status.mock.calls).toEqual([[callId], [secondBatch.callId], [secondBatch.callId]]);
  });

  it('retries a failed status request on the next scheduled check', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    status.mockRejectedValueOnce(new Error('Network unavailable'));
    monitor.check();
    await Promise.resolve();
    await advanceTime(1_000);
    expect(status).toHaveBeenCalledTimes(2);
    expect(monitor.output).toEqual([]);
  });

  it('uses backoff for a restored batch after its first 5 seconds', async () => {
    monitor.setBatches([{ ...batch, submittedAt: -5_000 }]);
    monitor.check();
    await Promise.resolve();
    await advanceTime(500);
    expect(status).toHaveBeenCalledTimes(1);
    await advanceTime(1_000);
    expect(status).toHaveBeenCalledTimes(2);
  });

  it.each([200, 400, 500])('stops status checks after terminal status %s', async terminalStatus => {
    status.mockResolvedValue({
      id: callId,
      chainId: '0x1',
      atomic: true,
      status: terminalStatus,
      receipts: [{ status: '0x1', transactionHash: txHash }]
    });
    monitor.check();
    await Promise.resolve();
    await advanceTime(60_000);
    expect(status).toHaveBeenCalledTimes(1);
    expect(monitor.output).toContainEqual(removePendingEvmBatchAction(callId));
  });
});
