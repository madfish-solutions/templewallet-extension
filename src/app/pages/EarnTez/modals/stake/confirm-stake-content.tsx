import React, { memo, useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { tzToMutez } from 'lib/temple/helpers';

import { ConfirmEarnOperationContent } from '../../components/confirm-earn-operation-content';
import { getStakingParams } from '../../estimate-staking';

import { StakeModalSelectors } from './selectors';
import { ReviewData } from './types';
import { useStakingEstimationData } from './use-staking-estimation-data';

interface ConfirmStakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmStakeContent = memo<ConfirmStakeContentProps>(({ reviewData, onCancel }) => {
  const balancesChanges = useMemo(
    () => [{ [TEZ_TOKEN_SLUG]: { atomicAmount: tzToMutez(reviewData?.amount ?? 0).negated(), isNft: false } }],
    [reviewData]
  );

  return (
    <ConfirmEarnOperationContent<ReviewData>
      getBasicParamsSWRKey={getBasicParamsSWRKey}
      formId="confirm-stake-form"
      balancesChanges={balancesChanges}
      reviewData={reviewData}
      cancelTestID={StakeModalSelectors.cancelButton}
      confirmTestID={StakeModalSelectors.confirmButton}
      getBasicParams={getBasicStakingParams}
      useEstimationData={useStakingEstimationData}
      onCancel={onCancel}
    />
  );
});

const getBasicStakingParams = ({ account, amount }: ReviewData, tezos: TezosToolkit) =>
  getStakingParams(account, tezos, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-basic-staking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId
];
