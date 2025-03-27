import React, { memo } from 'react';

import { TezosToolkit } from '@taquito/taquito';

import { OneAssetHeader } from 'app/templates/one-asset-header';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toLocalFixed } from 'lib/i18n';

import { ConfirmEarnOperationContent } from '../../components/confirm-earn-operation-content';
import { getStakingParams } from '../../estimate-staking';

import { StakeModalSelectors } from './selectors';
import { ReviewData } from './types';
import { useStakingEstimationData } from './use-staking-estimation-data';

interface ConfirmStakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmStakeContent = memo<ConfirmStakeContentProps>(({ reviewData, onCancel }) => (
  <ConfirmEarnOperationContent<ReviewData>
    getBasicParamsSWRKey={getBasicParamsSWRKey}
    formId="confirm-stake-form"
    reviewData={reviewData}
    renderTopElement={renderTopElement}
    cancelTestID={StakeModalSelectors.cancelButton}
    confirmTestID={StakeModalSelectors.confirmButton}
    getBasicParams={getBasicStakingParams}
    useEstimationData={useStakingEstimationData}
    onCancel={onCancel}
  />
));

const renderTopElement = ({ network, amount }: ReviewData) => (
  <OneAssetHeader amount={amount.toFixed()} network={network} assetSlug={TEZ_TOKEN_SLUG} />
);

const getBasicStakingParams = ({ account, amount }: ReviewData, tezos: TezosToolkit) =>
  getStakingParams(account, tezos, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-basic-staking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId
];
