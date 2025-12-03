import React, { memo, useCallback, useMemo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { T, t } from 'lib/i18n';
import { tokensToAtoms } from 'lib/temple/helpers';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { EvmChain, useAccountForEvm } from 'temple/front';
import { EvmNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { ConfirmEarnOperationContent } from '../components/confirm-earn-operation-content';
import { SuspenseLoader } from '../components/suspense-loader';
import { EthEarnReviewDataBase, EthStakingStats } from '../types';
import { useBlockExplorerUrl } from '../utils';

import { ClaimEthModalSelectors } from './selectors';
import { getClaimParams, useClaimEstimationData } from './use-claim-estimation-data';

interface ClaimModalProps {
  chain: EvmChain;
  stats: EthStakingStats;
  onRequestClose: EmptyFn;
}

export const ClaimModal = memo<ClaimModalProps>(({ onRequestClose, ...restProps }) => {
  return (
    <PageModal
      title={<T id="confirmAction" substitutions={<T id="claim" />} />}
      opened
      suspenseLoader={<SuspenseLoader />}
      titleRight={<div />}
      onGoBack={onRequestClose}
      onRequestClose={onRequestClose}
    >
      <ClaimModalContent {...restProps} onRequestClose={onRequestClose} />
    </PageModal>
  );
});

const ClaimModalContent = memo<ClaimModalProps>(({ chain, stats, onRequestClose }) => {
  const explorerBaseUrl = useBlockExplorerUrl(chain);
  const account = useAccountForEvm()!;

  const balancesChanges = useMemo(
    () => [
      {
        [EVM_TOKEN_SLUG]: {
          atomicAmount: tokensToAtoms(stats.withdrawRequest.readyForClaim, chain.currency.decimals),
          isNft: false
        }
      }
    ],
    [chain.currency.decimals, stats.withdrawRequest.readyForClaim]
  );

  const handleSuccess = useCallback(
    (hash: string) => {
      showTxSubmitToastWithDelay(TempleChainKind.EVM, hash, explorerBaseUrl, t('transactionSubmitted'));
      onRequestClose();
    },
    [explorerBaseUrl, onRequestClose]
  );

  const reviewData = useMemo(
    () => ({
      onConfirm: handleSuccess,
      account,
      network: chain
    }),
    [account, chain, handleSuccess]
  );

  return (
    <ConfirmEarnOperationContent<EthEarnReviewDataBase>
      getBasicParamsSWRKey={getBasicParamsSWRKey}
      formId="confirm-eth-claim-form"
      reviewData={reviewData}
      cancelTestID={ClaimEthModalSelectors.cancelButton}
      confirmTestID={ClaimEthModalSelectors.confirmButton}
      getBasicParams={getBasicClaimParams}
      useEstimationData={useClaimEstimationData}
      balancesChanges={balancesChanges}
      onCancel={onRequestClose}
    />
  );
});

const getBasicClaimParams = ({ account }: EthEarnReviewDataBase, network: EvmNetworkEssentials) =>
  getClaimParams(account, network);

const getBasicParamsSWRKey = ({ account, network }: EthEarnReviewDataBase) => [
  'get-eth-basic-claim-params',
  account.address,
  network.rpcBaseURL,
  network.chainId.toString()
];
