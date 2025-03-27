import React, { memo } from 'react';

import { TezosToolkit } from '@taquito/taquito';

import { OneAssetHeader } from 'app/templates/one-asset-header';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toLocalFixed } from 'lib/i18n';

import { ConfirmEarnOperationContent } from '../../components/confirm-earn-operation-content';

import { UnstakeModalSelectors } from './selectors';
import { ReviewData } from './types';
import { getUnstakingParams, useUnstakingEstimationData } from './use-unstaking-estimation-data';

interface ConfirmUnstakeContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmUnstakeContent = memo<ConfirmUnstakeContentProps>(({ reviewData, onCancel }) => (
  <ConfirmEarnOperationContent<ReviewData>
    getBasicParamsSWRKey={getBasicParamsSWRKey}
    formId="confirm-unstake-form"
    reviewData={reviewData}
    renderTopElement={renderTopElement}
    cancelTestID={UnstakeModalSelectors.cancelButton}
    confirmTestID={UnstakeModalSelectors.confirmButton}
    getBasicParams={getBasicUnstakingParams}
    useEstimationData={useUnstakingEstimationData}
    onCancel={onCancel}
  />
));

const renderTopElement = ({ network, amount }: ReviewData) => (
  <OneAssetHeader amount={amount.toFixed()} network={network} assetSlug={TEZ_TOKEN_SLUG} />
);

const getBasicUnstakingParams = ({ account, amount }: ReviewData, tezos: TezosToolkit) =>
  getUnstakingParams(account, tezos, amount);

const getBasicParamsSWRKey = ({ account, network, amount }: ReviewData) => [
  'get-basic-unstaking-params',
  account.address,
  amount.toFixed(),
  network.rpcBaseURL,
  network.chainId
];
