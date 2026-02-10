import { RefObject, memo, useEffect, useMemo, useState } from 'react';

import { LiFiStep } from '@lifi/sdk';
import retry from 'async-retry';

import { AddAssetProvider } from 'app/ConfirmPage/add-asset/context';
import { AddChainDataProvider } from 'app/ConfirmPage/add-chain/context';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { getProtocolFeeForRouteStep } from 'app/pages/Swap/form/EvmSwapForm/utils';
import ApproveModal from 'app/pages/Swap/modals/ApproveModal';
import { toastError } from 'app/toaster';
import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { EvmEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { atomsToTokens } from 'lib/temple/helpers';
import { AccountForChain } from 'temple/accounts';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { Route3EvmRoute, getCommonStepProps, isLifiStep } from '../../form/interfaces';
import { getTokenSlugFromEvmDexTokenAddress } from '../../utils';

import { EvmContent } from './EvmContent';
import { InitialInputData, UserAction } from './types';

interface ConfirmEvmUserActionProps {
  account: AccountForChain<TempleChainKind.EVM>;
  userAction: UserAction;
  firstExecuteAction: UserAction;
  onStepCompleted: EmptyFn;
  onRequestClose: EmptyFn;
  cancelledRef?: RefObject<boolean | null>;
  skipStatusWait?: boolean;
  submitDisabled?: boolean;
}

export const ConfirmEvmUserAction = memo<ConfirmEvmUserActionProps>(
  ({
    account,
    userAction,
    firstExecuteAction,
    onStepCompleted,
    onRequestClose,
    cancelledRef,
    skipStatusWait,
    submitDisabled
  }) => {
    const { type, routeStep } = userAction;
    const { fromChainId: firstActionFromChainId } = getCommonStepProps(firstExecuteAction.routeStep);
    const { fromChainId, fromToken, toChainId, toAmountMin, toToken } = getCommonStepProps(routeStep);

    const inputNetwork = useEvmChainByChainId(fromChainId);
    const outputNetwork = useEvmChainByChainId(toChainId);

    const initialInputNetwork = useEvmChainByChainId(firstActionFromChainId);

    if (!inputNetwork || !outputNetwork || !initialInputNetwork) throw new DeadEndBoundaryError();

    const [routeStepWithTransactionRequest, setRouteStepWithTransactionRequest] = useState<
      LiFiStep | Route3EvmRoute | null
    >(null);

    const stepReviewData = useMemo(() => {
      const base = {
        account,
        inputNetwork,
        outputNetwork,
        protocolFee: isLifiStep(routeStep) ? getProtocolFeeForRouteStep(routeStep, inputNetwork) : undefined,
        minimumReceived: {
          amount: atomsToTokens(toAmountMin, toToken.decimals).toString(),
          symbol: toToken.symbol
        }
      } as const;

      if (type === 'execute') {
        const safeExecuteStep = routeStepWithTransactionRequest ?? { ...routeStep, transactionRequest: undefined };
        return { ...base, routeStep: safeExecuteStep };
      }

      return { ...base, routeStep };
    }, [account, inputNetwork, outputNetwork, routeStep, toAmountMin, toToken, type, routeStepWithTransactionRequest]);

    const initialInputData = useMemo<InitialInputData>(
      () => ({
        tokenSlug: getTokenSlugFromEvmDexTokenAddress(fromToken.address),
        network: {
          chainId: initialInputNetwork.chainId,
          rpcBaseURL: initialInputNetwork.rpcBaseURL
        }
      }),
      [fromToken.address, initialInputNetwork]
    );

    useEffect(() => {
      if (type !== 'execute') return;
      let cancelled = false;

      const run = async () => {
        try {
          await retry(
            async () => {
              if (cancelled || cancelledRef?.current) return;

              const step = isLifiStep(routeStep) ? await getEvmStepTransaction(routeStep) : routeStep;

              if (cancelled || cancelledRef?.current) return;
              setRouteStepWithTransactionRequest(step);
            },
            { retries: 3, minTimeout: 2000, factor: 1 }
          );
        } catch (e: any) {
          console.warn(e);
          if (!cancelled && !cancelledRef?.current) {
            toastError('Failed to prepare transaction');
          }
        }
      };

      void run();

      return () => {
        cancelled = true;
      };
    }, [cancelledRef, type, routeStep]);

    return (
      <EvmEstimationDataProvider>
        {type === 'approve' ? (
          <AddChainDataProvider>
            <AddAssetProvider>
              <ApproveModal
                stepReviewData={stepReviewData}
                onClose={onRequestClose}
                onStepCompleted={onStepCompleted}
                submitDisabled={submitDisabled}
              />
            </AddAssetProvider>
          </AddChainDataProvider>
        ) : (
          <EvmContent
            stepReviewData={stepReviewData}
            initialInputData={initialInputData}
            onStepCompleted={onStepCompleted}
            cancelledRef={cancelledRef}
            skipStatusWait={skipStatusWait}
            submitDisabled={submitDisabled}
            onClose={onRequestClose}
          />
        )}
      </EvmEstimationDataProvider>
    );
  }
);
