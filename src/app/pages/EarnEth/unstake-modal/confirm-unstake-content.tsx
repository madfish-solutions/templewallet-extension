import React, { memo, useMemo } from 'react';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { tokensToAtoms } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { EvmNetworkEssentials } from 'temple/networks';

import { ConfirmEarnOperationContent } from '../components/confirm-earn-operation-content';

import { UnstakeEthModalSelectors } from './selectors';
import { ReviewData } from './types';
import { getUnstakingParams, useUnstakingEstimationData } from './use-unstaking-estimation-data';

interface ConfirmUnstakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmUnstakeContent = memo<ConfirmUnstakeContentProps>(({ reviewData, onCancel }) => {
  const balancesChanges = useMemo(
    () => [
      {
        [EVM_TOKEN_SLUG]: {
          atomicAmount: reviewData ? tokensToAtoms(reviewData.amount, reviewData.network.currency.decimals) : ZERO,
          isNft: false
        }
      }
    ],
    [reviewData]
  );

  return (
    <ConfirmEarnOperationContent<ReviewData>
      getBasicParamsSWRKey={getBasicParamsSWRKey}
      formId="confirm-eth-stake-form"
      reviewData={reviewData}
      cancelTestID={UnstakeEthModalSelectors.cancelButton}
      confirmTestID={UnstakeEthModalSelectors.confirmButton}
      getBasicParams={getBasicUnstakingParams}
      useEstimationData={useUnstakingEstimationData}
      balancesChanges={balancesChanges}
      onCancel={onCancel}
    />
  );
});

const getBasicUnstakingParams = ({ account, amount }: ReviewData, network: EvmNetworkEssentials) =>
  getUnstakingParams(account, network, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-eth-basic-staking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId.toString()
];
