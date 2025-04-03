import React, { memo, useCallback, useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { Alert } from 'app/atoms';
import { HashChip } from 'app/atoms/HashChip';
import { TextButton } from 'app/atoms/TextButton';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import { T } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';

import { BakerCard } from '../../components/baker-card';
import {
  ConfirmEarnOperationContent,
  ConfirmEarnOperationContentProps
} from '../../components/confirm-earn-operation-content';
import { getBakerAddress } from '../../utils';

import { getDelegationParams } from './estimate-delegation';
import { DelegationModalSelectors } from './selectors';
import { ReviewData } from './types';
import { useDelegationEstimationData } from './use-delegation-estimation-data';

interface ConfirmDelegationContentProps {
  reviewData?: ReviewData;
  onCancel: EmptyFn;
}

export const ConfirmDelegationContent = memo<ConfirmDelegationContentProps>(({ reviewData, onCancel }) => (
  <ConfirmEarnOperationContent<ReviewData>
    getBasicParamsSWRKey={getBasicParamsSWRKey}
    formId="confirm-delegation-form"
    reviewData={reviewData}
    renderTopElement={renderTopElement}
    cancelTestID={DelegationModalSelectors.cancelButton}
    confirmTestID={DelegationModalSelectors.delegateButton}
    confirmText={<T id="delegate" />}
    TxTabsInnerContent={TxTabsInnerContent}
    getBasicParams={getBasicDelegationParams}
    useEstimationData={useDelegationEstimationData}
    onCancel={onCancel}
  />
));

const renderTopElement = ({ network, account, baker }: ReviewData) => (
  <BakerCard
    network={network}
    accountPkh={account.address}
    baker={baker}
    HeaderRight={() => <HashChip hash={getBakerAddress(baker)} />}
  />
);

const getBasicDelegationParams = ({ account, baker }: ReviewData, tezos: TezosToolkit) =>
  getDelegationParams(account, tezos, getBakerAddress(baker));

const getBasicParamsSWRKey = ({ account, network, baker }: ReviewData) => [
  'get-basic-delegation-params',
  account.address,
  getBakerAddress(baker),
  network.rpcBaseURL,
  network.chainId
];

const TxTabsInnerContent: ConfirmEarnOperationContentProps<ReviewData>['TxTabsInnerContent'] = memo(
  ({ reviewData, estimationData, tezBalance }) => {
    const { baker, network } = reviewData;
    const dispatch = useDispatch();
    const { symbol: tezSymbol } = getTezosGasMetadata(network.chainId);

    const openWertPopup = useCallback(() => void dispatch(setOnRampPossibilityAction(true)), [dispatch]);
    const delegatedAmount = useMemo(
      () => BigNumber.max(ZERO, tezBalance.minus(estimationData?.gasFee ?? ZERO)),
      [estimationData?.gasFee, tezBalance]
    );

    if (typeof baker === 'object' && delegatedAmount.lt(baker.delegation.minBalance)) {
      return (
        <Alert
          className="mb-4"
          type="warning"
          closable={false}
          description={
            <div className="flex flex-col gap-0.5">
              <p className="text-font-description-bold">
                <T id="minDelegationBalanceTitle" />
              </p>
              <p className="text-font-description">
                <T id="minDelegationBalanceDescription" />
              </p>
              <div className="flex gap-1 items-center">
                <span className="text-font-description">
                  <T id="topUp" /> {tezSymbol}:
                </span>
                <TextButton color="blue" onClick={openWertPopup}>
                  <T id="buyWithCardShort" />
                </TextButton>
              </div>
            </div>
          }
        />
      );
    }

    return null;
  }
);
