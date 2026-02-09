import React, { memo, useMemo } from 'react';

import { TezosToolkit } from '@tezos-x/octez.js';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { tzToMutez } from 'lib/temple/helpers';

import { ConfirmEarnOperationContent } from '../../components/confirm-earn-operation-content';

import { UnstakeModalSelectors } from './selectors';
import { ReviewData } from './types';
import { getUnstakingParams, useUnstakingEstimationData } from './use-unstaking-estimation-data';

interface ConfirmUnstakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmUnstakeContent = memo<ConfirmUnstakeContentProps>(({ reviewData, onCancel }) => {
  const balancesChanges = useMemo(
    () => (reviewData ? [{ [TEZ_TOKEN_SLUG]: { atomicAmount: tzToMutez(reviewData.amount), isNft: false } }] : []),
    [reviewData]
  );

  return (
    <ConfirmEarnOperationContent<ReviewData>
      getBasicParamsSWRKey={getBasicParamsSWRKey}
      formId="confirm-unstake-form"
      balancesChanges={balancesChanges}
      reviewData={reviewData}
      cancelTestID={UnstakeModalSelectors.cancelButton}
      confirmTestID={UnstakeModalSelectors.confirmButton}
      getBasicParams={getBasicUnstakingParams}
      useEstimationData={useUnstakingEstimationData}
      onCancel={onCancel}
    />
  );
});

const getBasicUnstakingParams = ({ account, amount }: ReviewData, tezos: TezosToolkit) =>
  getUnstakingParams(account, tezos, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-basic-unstaking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId
];
