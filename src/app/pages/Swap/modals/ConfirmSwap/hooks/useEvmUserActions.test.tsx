import { act, useEffect } from 'react';

import { createRoot, Root } from 'react-dom/client';

import { EvmReviewData } from 'app/pages/Swap/form/interfaces';
import { getAlchemyWalletConfig } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { getAlchemySubmission } from 'lib/evm/alchemy/submission';
import { TempleAccountType } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { useEvmAllowances } from '../../SwapSelectAsset/hooks';

import { useEvmUserActions } from './useEvmUserActions';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({ getAlchemyWalletConfig: jest.fn() }));
jest.mock('lib/evm/alchemy/submission', () => ({ getAlchemySubmission: jest.fn() }));
jest.mock('../../SwapSelectAsset/hooks', () => ({ useEvmAllowances: jest.fn() }));
jest.mock('./usePrefetchEvmStepTransactions', () => ({
  usePrefetchEvmStepTransactions: () => ({ progressionBlocked: false })
}));
jest.mock('lib/ui/hooks', () => ({ useBooleanState: () => [false, jest.fn(), jest.fn()] }));

let current: ReturnType<typeof useEvmUserActions>;
let root: Root;
let container: HTMLDivElement;
const onClose = jest.fn();

function Harness({ review }: { review: EvmReviewData }) {
  const result = useEvmUserActions(true, onClose, review);
  useEffect(() => {
    current = result;
  }, [result]);
  return null;
}

function makeReview(type = TempleAccountType.HD): EvmReviewData {
  return {
    account: { address: '0x1111111111111111111111111111111111111111', type },
    network: { kind: TempleChainKind.EVM, chainId: 1 },
    swapRoute: {
      steps: [
        {
          id: 'route',
          type: 'lifi',
          action: {
            fromChainId: 1,
            toChainId: 10,
            fromAmount: '100',
            fromToken: { address: '0x2222222222222222222222222222222222222222' }
          },
          estimate: { fromAmount: '100' }
        }
      ]
    },
    handleResetForm: jest.fn()
  } as unknown as EvmReviewData;
}

async function render(review = makeReview()): Promise<void> {
  await act(async () => {
    root.render(<Harness review={review} />);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  (getAlchemyWalletConfig as jest.Mock).mockResolvedValue({ chains: [1], feeTokens: {} });
  (getAlchemySubmission as jest.Mock).mockResolvedValue(undefined);
  (useEvmAllowances as jest.Mock).mockReturnValue({ allowanceSufficient: [false], loading: false });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

it('collapses approval and execution on a supported chain', async () => {
  await render();
  expect(current.userActions).toHaveLength(1);
  expect(current.userActions[0].batchSteps).toHaveLength(1);
  expect(current.skipStatusWait).toBe(true);
});

it('keeps the original actions on an unsupported chain or unavailable backend', async () => {
  (getAlchemyWalletConfig as jest.Mock).mockResolvedValueOnce({ chains: [], feeTokens: {} });
  await render();
  expect(current.userActions.map(action => action.type)).toEqual(['approve', 'execute']);
  (getAlchemyWalletConfig as jest.Mock).mockRejectedValueOnce(new Error('Unavailable'));
  await render(makeReview());
  expect(current.userActions.map(action => action.type)).toEqual(['approve', 'execute']);
});

it('keeps Ledger on the original flow', async () => {
  await render(makeReview(TempleAccountType.Ledger));
  expect(getAlchemyWalletConfig).not.toHaveBeenCalled();
  expect(current.userActions.map(action => action.type)).toEqual(['approve', 'execute']);
});

it('restores the original actions through the backdoor', async () => {
  await render();
  await act(async () => {
    current.useLegacyFlow();
  });
  expect(current.userActions.map(action => action.type)).toEqual(['approve', 'execute']);
  expect(current.userActions[0].batchSteps).toBeUndefined();
});

it('allows the user to close while an Alchemy batch is busy', async () => {
  await render();
  await act(async () => {
    current.setBatchBusy(true);
  });
  await act(async () => {
    current.handleRequestClose();
  });
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(current.cancelledRef.current).toBe(true);
});

it('resumes a submitted route when the feature flag is disabled', async () => {
  const review = makeReview();
  (getAlchemyWalletConfig as jest.Mock).mockResolvedValue({ chains: [], feeTokens: {} });
  (getAlchemySubmission as jest.Mock).mockResolvedValue({
    version: 1,
    steps: 'steps' in review.swapRoute ? review.swapRoute.steps : []
  });
  await render(review);
  expect(current.userActions).toHaveLength(1);
  expect(current.userActions[0].batchSteps).toHaveLength(1);
});
