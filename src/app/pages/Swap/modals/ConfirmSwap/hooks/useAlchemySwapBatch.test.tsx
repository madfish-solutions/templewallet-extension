import { act, useEffect } from 'react';

import { createRoot, type Root } from 'react-dom/client';

import { getAlchemyCallsStatus, prepareAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { buildAlchemySwapCalls } from 'lib/evm/alchemy/swap';
import { account, makeQuote, makeStep } from 'lib/evm/alchemy/test-fixtures';
import { ALCHEMY_DELEGATION, getAlchemyOperation } from 'lib/evm/alchemy/validation';
import { useTempleClient } from 'lib/temple/front';
import type { EvmChain } from 'temple/front';

import { useAlchemySwapBatch } from './useAlchemySwapBatch';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  ...jest.requireActual('lib/apis/temple/endpoints/evm/alchemy-wallet'),
  prepareAlchemyCalls: jest.fn(),
  getAlchemyCallsStatus: jest.fn()
}));
jest.mock('lib/evm/alchemy/swap', () => ({ buildAlchemySwapCalls: jest.fn() }));
jest.mock('lib/temple/front', () => ({ useTempleClient: jest.fn() }));
jest.mock('lib/utils', () => ({ delay: () => Promise.resolve() }));
const network = { chainId: 1, currency: { decimals: 18 } } as EvmChain;
const steps = [makeStep()];
const submit = jest.fn();
const status = getAlchemyCallsStatus as jest.MockedFunction<typeof getAlchemyCallsStatus>;
const callId = `0x${'aa'.repeat(64)}` as const;
const prepare = prepareAlchemyCalls as jest.MockedFunction<typeof prepareAlchemyCalls>;
let current: ReturnType<typeof useAlchemySwapBatch>;
let root: Root;
let container: HTMLDivElement;
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
  jest.resetAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  (useTempleClient as jest.Mock).mockReturnValue({ submitAlchemyBatch: submit });
  const quote = makeQuote();
  (buildAlchemySwapCalls as jest.MockedFunction<typeof buildAlchemySwapCalls>).mockResolvedValue({
    calls: quote.request.calls,
    minNativeReceivedByCall: {},
    steps
  });
  prepare.mockResolvedValue(quote.prepared);
  submit.mockResolvedValue(callId);
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
it('submits the reviewed quote once through the background', async () => {
  const reviewed = current.quote;
  await act(async () => {
    expect(await current.execute()).toBe(callId);
  });
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit.mock.calls[0][2]).toEqual(reviewed);
  expect(status).not.toHaveBeenCalled();
});

it('includes minimum native receipts in the submitted quote', async () => {
  (buildAlchemySwapCalls as jest.MockedFunction<typeof buildAlchemySwapCalls>).mockResolvedValueOnce({
    calls: makeQuote().request.calls,
    minNativeReceivedByCall: { 0: '0x5' },
    steps
  });
  await act(async () => current.refresh());
  await act(async () => {
    await current.execute();
  });

  expect(submit.mock.calls[0][2].minNativeReceivedByCall).toEqual({ 0: '0x5' });
});
it.each([
  ['slow', 0.7],
  ['mid', 0.85],
  ['fast', 1]
] as const)('uses the real fee helper for %s', async (option, multiplier) => {
  await act(async () => {
    current.selectFeeOption(option);
  });
  expect(prepare.mock.calls[prepare.mock.calls.length - 1]?.[0].capabilities?.gasParamsOverride).toEqual({
    maxFeePerGas: { multiplier },
    maxPriorityFeePerGas: { multiplier }
  });
});
it('prepares a fresh LiFi transaction after quote expiry', async () => {
  const quote = current.quote!;
  jest.spyOn(Date, 'now').mockReturnValue(quote.expiresAt + 1);
  await act(async () => {
    await current.execute();
  });
  expect(submit).not.toHaveBeenCalled();
  expect(buildAlchemySwapCalls).toHaveBeenCalledTimes(2);
  jest.restoreAllMocks();
});
it('retains the fee options and delegation notice during fee re-estimation without allowing submission', async () => {
  const operation = getAlchemyOperation(makeQuote().prepared);
  prepare.mockResolvedValueOnce({
    type: 'array',
    data: [{ type: 'authorization', chainId: '0x1', data: { address: ALCHEMY_DELEGATION, nonce: '0x0' } }, operation]
  });
  await act(async () => current.refresh());
  expect(current.delegationRequired).toBe(true);
  const reviewed = current.quote;
  const feeOptions = current.feeOptions;
  let finish!: (value: Awaited<ReturnType<typeof prepareAlchemyCalls>>) => void;
  prepare.mockReturnValueOnce(
    new Promise(resolve => {
      finish = resolve;
    })
  );
  await act(async () => current.selectFeeOption('slow'));
  expect(current.busy).toBe(true);
  expect(current.selectedFeeOption).toBe('slow');
  expect(current.feeOptions).toEqual(feeOptions);
  expect(current.delegationRequired).toBe(true);
  expect(current.quote).toBe(reviewed);
  await act(async () => {
    await current.execute();
  });
  expect(submit).not.toHaveBeenCalled();
  await act(async () => finish(reviewed!.prepared));
  expect(current.busy).toBe(false);
  expect(current.quote?.feeOption).toBe('slow');
});

it('accepts another fee choice before the prior request finishes and ignores its late result', async () => {
  let finish!: (value: Awaited<ReturnType<typeof prepareAlchemyCalls>>) => void;
  prepare.mockReturnValueOnce(
    new Promise(resolve => {
      finish = resolve;
    })
  );
  await act(async () => current.selectFeeOption('slow'));
  const signal = prepare.mock.calls[prepare.mock.calls.length - 1][1];
  await act(async () => current.selectFeeOption('fast'));
  expect(signal?.aborted).toBe(true);
  expect(current.quote?.feeOption).toBe('fast');
  await act(async () => finish(makeQuote().prepared));
  expect(current.quote?.feeOption).toBe('fast');
});

it('displays the refreshed LiFi values', async () => {
  const refreshed = makeStep();
  refreshed.action.fromAmount = '150';
  refreshed.estimate.toAmountMin = '140';
  (buildAlchemySwapCalls as jest.MockedFunction<typeof buildAlchemySwapCalls>).mockResolvedValueOnce({
    calls: makeQuote().request.calls,
    minNativeReceivedByCall: {},
    steps: [refreshed]
  });
  await act(async () => {
    current.refresh();
  });
  expect(current.reviewSteps[0].estimate.toAmountMin).toBe('140');
});

it('returns the call ID without waiting for a transaction hash', async () => {
  await act(async () => {
    expect(await current.execute()).toBe(callId);
  });
  expect(current.submitted).toBe(true);
  expect(status).not.toHaveBeenCalled();
});

it('reuses the call ID after submission', async () => {
  await act(async () => {
    expect(await current.execute()).toBe(callId);
    expect(await current.execute()).toBe(callId);
  });
  expect(submit).toHaveBeenCalledTimes(1);
});

it('propagates a send error and allows an explicit re-estimation', async () => {
  submit.mockRejectedValueOnce(new Error('Submission unavailable'));
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('Submission unavailable');
  });
  expect(current.submitted).toBe(false);
  await act(async () => current.refresh());
  expect(prepare).toHaveBeenCalledTimes(2);
  expect(submit).toHaveBeenCalledTimes(1);
});

it('prevents concurrent confirmation clicks from submitting twice', async () => {
  let finish!: (id: typeof callId) => void;
  submit.mockReturnValueOnce(
    new Promise(resolve => {
      finish = resolve;
    })
  );
  await act(async () => {
    const first = current.execute();
    expect(await current.execute()).toBeUndefined();
    finish(callId);
    expect(await first).toBe(callId);
  });
  expect(submit).toHaveBeenCalledTimes(1);
});

it('returns the call ID if the modal closes before submission returns', async () => {
  let finish!: (id: typeof callId) => void;
  submit.mockReturnValueOnce(
    new Promise(resolve => {
      finish = resolve;
    })
  );
  let execution!: ReturnType<typeof current.execute>;
  await act(async () => {
    execution = current.execute();
  });
  await act(async () => root.render(null));
  finish(callId);
  expect(await execution).toBe(callId);
  expect(submit).toHaveBeenCalledTimes(1);
});
