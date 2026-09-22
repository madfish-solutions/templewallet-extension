import { act, useEffect } from 'react';

import { createRoot, type Root } from 'react-dom/client';

import { prepareAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { browser } from 'lib/browser';
import { getAlchemySubmissionKey, type AlchemySubmission } from 'lib/evm/alchemy/submission';
import { buildAlchemySwapCalls } from 'lib/evm/alchemy/swap';
import { account, makeQuote, makeStep, makeSubmission } from 'lib/evm/alchemy/test-fixtures';
import { getAlchemyOperation, getAlchemyOperationHash } from 'lib/evm/alchemy/validation';
import { useTempleClient } from 'lib/temple/front';
import type { EvmChain } from 'temple/front';

import { useAlchemySwapBatch } from './useAlchemySwapBatch';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  ...jest.requireActual('lib/apis/temple/endpoints/evm/alchemy-wallet'),
  prepareAlchemyCalls: jest.fn()
}));
jest.mock('lib/evm/alchemy/swap', () => ({ buildAlchemySwapCalls: jest.fn() }));
jest.mock('lib/temple/front', () => ({ useTempleClient: jest.fn() }));
jest.mock('lib/utils', () => ({ delay: () => Promise.resolve() }));
jest.mock('lib/browser', () => ({
  browser: {
    storage: {
      local: { get: jest.fn(), remove: jest.fn() },
      onChanged: { addListener: jest.fn(), removeListener: jest.fn() }
    }
  }
}));
const network = { chainId: 1, currency: { decimals: 18 } } as EvmChain;
const steps = [makeStep()];
const submit = jest.fn();
const check = jest.fn();
const complete = jest.fn();
const prepare = prepareAlchemyCalls as jest.MockedFunction<typeof prepareAlchemyCalls>;
let current: ReturnType<typeof useAlchemySwapBatch>;
let root: Root;
let container: HTMLDivElement;
let stored: AlchemySubmission | undefined;
const key = getAlchemySubmissionKey(account, 1);
const hash = `0x${'ab'.repeat(32)}` as const;
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
  stored = undefined;
  (browser.storage.local.get as jest.Mock).mockImplementation(async () => ({ [key]: stored }));
  (browser.storage.local.remove as jest.Mock).mockImplementation(async () => {
    stored = undefined;
  });
  (useTempleClient as jest.Mock).mockReturnValue({
    submitAlchemyBatch: submit,
    checkAlchemyBatch: check,
    completeAlchemyBatch: complete
  });
  const quote = makeQuote();
  (buildAlchemySwapCalls as jest.MockedFunction<typeof buildAlchemySwapCalls>).mockResolvedValue({
    calls: quote.request.calls,
    steps
  });
  prepare.mockResolvedValue(quote.prepared);
  check.mockImplementation(async () => stored);
  submit.mockImplementation(async () => {
    stored = { ...makeSubmission(), result: { status: 'confirmed', transactionHash: hash } };
    return stored;
  });
  await mount();
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
it('submits the reviewed quote once through the background', async () => {
  const reviewed = current.quote;
  await act(async () => {
    expect(await current.execute()).toBe(hash);
  });
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submit.mock.calls[0][2]).toEqual(reviewed);
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
it('displays the refreshed LiFi values', async () => {
  const refreshed = makeStep();
  refreshed.action.fromAmount = '150';
  refreshed.estimate.toAmountMin = '140';
  (buildAlchemySwapCalls as jest.MockedFunction<typeof buildAlchemySwapCalls>).mockResolvedValueOnce({
    calls: makeQuote().request.calls,
    steps: [refreshed]
  });
  await act(async () => {
    current.refresh();
  });
  expect(current.reviewSteps[0].estimate.toAmountMin).toBe('140');
});
it('restores a pending submission without a new quote', async () => {
  stored = makeSubmission();
  stored.attempts[0].state = 'pending';
  await act(async () => {
    current.refresh();
  });
  expect(current.submitted).toBe(true);
  expect(prepare).toHaveBeenCalledTimes(1);
});
it('requires review of a replacement, then submits it without another preparation', async () => {
  stored = makeSubmission();
  stored.attempts[0].state = 'pending';
  await act(async () => {
    current.refresh();
  });
  const replacement = getAlchemyOperation(makeQuote().prepared);
  replacement.data.maxFeePerGas = '0x3';
  replacement.signatureRequest.data.raw = getAlchemyOperationHash(replacement);
  prepare.mockResolvedValueOnce(replacement);
  await act(async () => {
    expect(await current.execute()).toBeUndefined();
  });
  expect(current.replacementReady).toBe(true);
  expect(submit).not.toHaveBeenCalled();
  const reviewed = current.quote;
  prepare.mockRejectedValueOnce(new Error('Unexpected extra preparation'));
  await act(async () => {
    expect(await current.execute()).toBe(hash);
  });
  expect(prepare).toHaveBeenCalledTimes(2);
  expect(submit.mock.calls[0][2]).toEqual(reviewed);
});
it('returns a completed original operation before any replacement', async () => {
  stored = { ...makeSubmission(), result: { status: 'confirmed', transactionHash: hash } };
  await act(async () => {
    expect(await current.execute()).toBe(hash);
  });
  expect(submit).not.toHaveBeenCalled();
  expect(prepare).toHaveBeenCalledTimes(1);
});
it('refuses a replacement with a new nonce', async () => {
  stored = makeSubmission();
  stored.attempts[0].state = 'pending';
  const replacement = getAlchemyOperation(makeQuote().prepared);
  replacement.data.nonce = '0x11';
  replacement.signatureRequest.data.raw = getAlchemyOperationHash(replacement);
  prepare.mockResolvedValueOnce(replacement);
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('nonce changed');
  });
  expect(submit).not.toHaveBeenCalled();
});
it('blocks a new signature while the original submission remains ambiguous', async () => {
  stored = makeSubmission();
  stored.attempts[0].state = 'unknown';
  await act(async () => {
    await expect(current.execute()).rejects.toThrow('unresolved');
  });
  expect(submit).not.toHaveBeenCalled();
  expect(prepare).toHaveBeenCalledTimes(1);
});
it('asks the background to clear only the completed transaction', async () => {
  await act(async () => {
    await current.complete(hash);
  });
  expect(complete).toHaveBeenCalledWith(account, 1, hash);
  expect(browser.storage.local.remove).not.toHaveBeenCalled();
});
it('permits a fresh quote after a definitive failure', async () => {
  stored = { ...makeSubmission(), result: { status: 'failed' } };
  await act(async () => {
    current.refresh();
  });
  expect(current.submitted).toBe(false);
  expect(prepare).toHaveBeenCalledTimes(2);
});
it('does not show a previous failed swap when a new preparation fails', async () => {
  stored = { ...makeSubmission(), steps: [makeStep(10)], result: { status: 'failed' } };
  prepare.mockRejectedValueOnce(new Error('Quote unavailable'));
  await act(async () => {
    current.refresh();
  });
  expect(current.reviewSteps).toEqual(steps);
  expect(current.quote).toBeUndefined();
});
