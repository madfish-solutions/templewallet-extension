import React, { memo, useCallback, useMemo } from 'react';

import { TezosToolkit } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useDispatch } from 'react-redux';

import { Alert } from 'app/atoms';
import { DescriptionWithHeader } from 'app/atoms/Alert';
import { HashChip } from 'app/atoms/HashChip';
import { TextButton } from 'app/atoms/TextButton';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { FeeSummary } from 'app/templates/fee-summary';
import { TEZOS_CHAIN_ASSET_SLUG } from 'lib/apis/wert';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { T } from 'lib/i18n';
import { useTezosGasMetadata } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';
import { AssetsAmounts } from 'temple/types';

import { BakerCard } from '../../components/baker-card';
import {
  ConfirmEarnOperationContent,
  ConfirmEarnOperationContentProps,
  RenderTopElementProps
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

const balancesChanges: AssetsAmounts[] = [];

export const ConfirmDelegationContent = memo<ConfirmDelegationContentProps>(({ reviewData, onCancel }) => (
  <ConfirmEarnOperationContent<ReviewData>
    getBasicParamsSWRKey={getBasicParamsSWRKey}
    formId="confirm-delegation-form"
    reviewData={reviewData}
    balancesChanges={balancesChanges}
    TopElement={TopElement}
    cancelTestID={DelegationModalSelectors.cancelButton}
    confirmTestID={DelegationModalSelectors.delegateButton}
    confirmText={<T id="delegate" />}
    TxTabsInnerContent={TxTabsInnerContent}
    getBasicParams={getBasicDelegationParams}
    useEstimationData={useDelegationEstimationData}
    onCancel={onCancel}
  />
));

const TopElement = memo<RenderTopElementProps<ReviewData>>(
  ({ reviewData, displayedFee, displayedStorageFee, goToFeeTab }) => {
    const { network, account, baker } = reviewData;

    const HeaderRight = useCallback(() => <HashChip hash={getBakerAddress(baker)} />, [baker]);

    return (
      <div className="flex flex-col my-4 gap-4">
        <BakerCard network={network} accountPkh={account.address} baker={baker} HeaderRight={HeaderRight} />

        <FeeSummary
          network={network}
          assetSlug={TEZ_TOKEN_SLUG}
          gasFee={displayedFee}
          storageFee={displayedStorageFee}
          onOpenFeeTab={goToFeeTab}
        />
      </div>
    );
  }
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
    const { symbol: tezSymbol } = useTezosGasMetadata(network.chainId);

    const openWertPopup = useCallback(
      () => void dispatch(setOnRampAssetAction({ chainAssetSlug: TEZOS_CHAIN_ASSET_SLUG })),
      [dispatch]
    );
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
            <DescriptionWithHeader header={<T id="minDelegationBalanceTitle" />}>
              <p>
                <T id="minDelegationBalanceDescription" />
              </p>
              <div className="flex gap-1 items-center">
                <span>
                  <T id="topUp" /> {tezSymbol}:
                </span>
                <TextButton color="blue" onClick={openWertPopup}>
                  <T id="buyWithCardShort" />
                </TextButton>
              </div>
            </DescriptionWithHeader>
          }
        />
      );
    }

    return null;
  }
);
