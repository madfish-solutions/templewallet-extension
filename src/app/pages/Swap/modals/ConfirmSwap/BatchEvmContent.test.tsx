import { act, type ComponentProps } from 'react';

import { createRoot, type Root } from 'react-dom/client';

import { account, makeStep } from 'lib/evm/alchemy/test-fixtures';
import { TempleAccountType } from 'lib/temple/types';
import type { EvmChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { BaseContent } from './BaseContent';
import { BatchEvmContent } from './BatchEvmContent';
import { useAlchemySwapBatch } from './hooks/useAlchemySwapBatch';

jest.mock('./BaseContent', () => ({ BaseContent: jest.fn(() => null) }));
jest.mock('./hooks/useAlchemySwapBatch', () => ({ useAlchemySwapBatch: jest.fn() }));
jest.mock('./evm-balances', () => ({ getBalancesChanges: () => [] }));
jest.mock('app/atoms/Tooltip', () => ({ Tooltip: () => null }));
jest.mock('app/store', () => ({ dispatch: jest.fn() }));
jest.mock('lib/i18n', () => ({ T: () => null }));
jest.mock('lib/ui', () => ({ LedgerOperationState: { NotStarted: 0 } }));
jest.mock('lib/ui/show-tx-submit-toast.util', () => ({ showTxSubmitToastWithDelay: jest.fn() }));
jest.mock('lib/temple/helpers', () => ({ atomsToTokens: (value: string) => value }));
jest.mock('temple/front/ready', () => ({ useGetEvmActiveBlockExplorer: () => jest.fn() }));
jest.mock('temple/front/use-block-explorers', () => ({ makeBlockExplorerHref: jest.fn() }));
jest.mock('../../form/EvmSwapForm/utils', () => ({ getProtocolFeeForRouteStep: jest.fn() }));
jest.mock('../../form/utils', () => ({ formatDuration: jest.fn(), getBufferedExecutionDuration: jest.fn() }));
jest.mock('../../utils', () => ({ getTokenSlugFromEvmDexTokenAddress: (address: string) => address }));

const network = { chainId: 1, currency: { decimals: 18 } } as EvmChain;
const steps = [makeStep()];
const fallback = jest.fn();
const refresh = jest.fn();
const execute = jest.fn();
const cancelledRef = { current: false };
const props: ComponentProps<typeof BatchEvmContent> = {
  stepReviewData: {
    account: { address: account, id: 'test', name: 'Test', chain: TempleChainKind.EVM, type: TempleAccountType.HD },
    inputNetwork: network,
    outputNetwork: network,
    routeStep: steps[0],
    minimumReceived: { amount: '98', symbol: 'T' }
  },
  initialInputData: { tokenSlug: 'token', network },
  batchSteps: steps,
  onClose: jest.fn(),
  onStepCompleted: jest.fn(),
  onUseLegacyFlow: fallback,
  cancelledRef
};
let batch: ReturnType<typeof useAlchemySwapBatch>;
let root: Root;
let container: HTMLDivElement;

function contentProps(): ComponentProps<typeof BaseContent> {
  return (BaseContent as jest.Mock).mock.calls.slice(-1)[0][0];
}

async function render(): Promise<void> {
  await act(async () => root.render(<BatchEvmContent {...props} />));
}

async function submit(): Promise<void> {
  await act(async () => {
    await contentProps().onSubmit({ gasPrice: '', gasLimit: '', nonce: '', data: '', rawTransaction: '' });
  });
}

beforeEach(async () => {
  jest.resetAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  cancelledRef.current = false;
  batch = {
    reviewSteps: steps,
    error: new Error('Estimate unavailable'),
    busy: false,
    submitted: false,
    refresh,
    execute
  } as unknown as ReturnType<typeof useAlchemySwapBatch>;
  (useAlchemySwapBatch as jest.Mock).mockImplementation(() => batch);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await render();
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('re-estimates on the first Retry and uses legacy on the second Retry', async () => {
  await submit();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(fallback).not.toHaveBeenCalled();
  await submit();
  expect(fallback).toHaveBeenCalledTimes(1);
  expect(execute).not.toHaveBeenCalled();
});

it('retains the retry count across a successful estimate and a subsequent submit error', async () => {
  await submit();
  batch = { ...batch, error: undefined };
  execute.mockRejectedValueOnce(new Error('Submission rejected'));
  await render();
  await submit();
  expect(execute).toHaveBeenCalledTimes(1);
  expect(fallback).not.toHaveBeenCalled();
  await submit();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(fallback).toHaveBeenCalledTimes(1);
});

it('checks a submitted batch instead of selecting legacy after the first Retry', async () => {
  await submit();
  batch = { ...batch, submitted: true };
  await render();
  await submit();
  expect(execute).toHaveBeenCalledTimes(1);
  expect(fallback).not.toHaveBeenCalled();
});

it('ignores Retry after the user closes the modal', async () => {
  await submit();
  cancelledRef.current = true;
  await submit();
  expect(fallback).not.toHaveBeenCalled();
});
