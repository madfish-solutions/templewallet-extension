import React, { memo, useCallback, useMemo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { T } from 'lib/i18n';
import { NullComponent } from 'lib/ui/null-component';
import { showTxSubmitToastWithDelay } from 'lib/ui/show-tx-submit-toast.util';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ConfirmEarnOperationContent } from '../../components/confirm-earn-operation-content';
import { TezosEarnReviewDataBase } from '../../types';
import { useBlockExplorerUrl } from '../../utils';

import { FinalizeModalSelectors } from './selectors';
import { getFinalizationParams, useFinalizationEstimationData } from './use-finalization-estimation';

interface FinalizeModalProps {
  account: AccountForTezos;
  network: TezosChain;
  onClose: EmptyFn;
}

export const FinalizeModal = memo<FinalizeModalProps>(({ account, network, onClose }) => {
  const explorerBaseUrl = useBlockExplorerUrl(network);

  const handleConfirm = useCallback(
    (hash: string) => {
      showTxSubmitToastWithDelay(TempleChainKind.Tezos, hash, explorerBaseUrl);
      onClose();
    },
    [explorerBaseUrl, onClose]
  );

  const reviewData = useMemo(() => ({ account, network, onConfirm: handleConfirm }), [account, handleConfirm, network]);

  return (
    <PageModal title={<T id="finalizeUnstake" />} opened titleLeft={null} onRequestClose={onClose}>
      <ConfirmEarnOperationContent
        getBasicParamsSWRKey={getBasicParamsSWRKey}
        formId="confirm-finalize-form"
        reviewData={reviewData}
        renderTopElement={NullComponent}
        cancelTestID={FinalizeModalSelectors.cancelButton}
        confirmTestID={FinalizeModalSelectors.confirmButton}
        getBasicParams={getBasicFinalizationParams}
        useEstimationData={useFinalizationEstimationData}
        onCancel={onClose}
      />
    </PageModal>
  );
});

const getBasicParamsSWRKey = ({ account, network }: TezosEarnReviewDataBase) => [
  'get-basic-finalize-params',
  account.address,
  network.chainId
];

const getBasicFinalizationParams = ({ account }: TezosEarnReviewDataBase) => getFinalizationParams(account);
