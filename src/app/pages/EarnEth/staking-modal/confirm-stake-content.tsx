import React, { memo, useMemo } from 'react';

import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { tokensToAtoms } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { EvmNetworkEssentials } from 'temple/networks';

import { ConfirmEarnOperationContent } from '../components/confirm-earn-operation-content';

import { StakeEthModalSelectors } from './selectors';
import { ReviewData } from './types';
import { getStakingParams, useStakingEstimationData } from './use-staking-estimation-data';

interface ConfirmStakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmStakeContent = memo<ConfirmStakeContentProps>(({ reviewData, onCancel }) => {
  const balancesChanges = useMemo(
    () => [
      {
        [EVM_TOKEN_SLUG]: {
          atomicAmount: reviewData
            ? tokensToAtoms(reviewData.amount, reviewData.network.currency.decimals).negated()
            : ZERO,
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
      cancelTestID={StakeEthModalSelectors.cancelButton}
      confirmTestID={StakeEthModalSelectors.confirmButton}
      getBasicParams={getBasicStakingParams}
      useEstimationData={useStakingEstimationData}
      balancesChanges={balancesChanges}
      onCancel={onCancel}
    />
  );
});

const getBasicStakingParams = ({ account, amount }: ReviewData, network: EvmNetworkEssentials) =>
  getStakingParams(account, network, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-eth-basic-staking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId.toString()
];
