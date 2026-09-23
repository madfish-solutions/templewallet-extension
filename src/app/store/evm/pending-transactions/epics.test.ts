import type { Action } from 'redux';
import { StateObservable } from 'redux-observable';
import { Subject } from 'rxjs';

import type { RootState } from 'app/store/root-state.type';
import { getAlchemyCallsStatus } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';

import { monitorPendingEvmBatchesAction } from './actions';
import { monitorPendingEvmBatchesEpic } from './epics';
import type { PendingEvmBatch } from './state';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({ getAlchemyCallsStatus: jest.fn() }));
jest.mock('app/toaster', () => ({ toastError: jest.fn(), toastSuccess: jest.fn() }));

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

const checkBatch = async (): Promise<Action[]> => {
  const action$ = new Subject<Action>();
  const state = { pendingEvmTransactions: { batches: { [callId]: batch } } } as RootState;
  const state$ = new StateObservable(new Subject<RootState>(), state);
  const output: Action[] = [];
  const subscription = monitorPendingEvmBatchesEpic(action$, state$, undefined).subscribe(action =>
    output.push(action)
  );
  action$.next(monitorPendingEvmBatchesAction());
  await new Promise(resolve => setTimeout(resolve, 0));
  subscription.unsubscribe();
  return output;
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
