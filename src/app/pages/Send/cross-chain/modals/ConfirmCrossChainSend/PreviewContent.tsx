import React, { FC, useEffect, useRef, useState } from 'react';

import { noop } from 'lodash';
import { unstable_serialize, useSWRConfig } from 'swr';

import { Loader } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as XCircleFill } from 'app/icons/base/x_circle_fill.svg';
import { EvmReviewData, TezosReviewData } from 'app/pages/Send/form/interfaces';
import { EvmContent } from 'app/pages/Send/modals/ConfirmSend/EvmContent';
import { TezosContent } from 'app/pages/Send/modals/ConfirmSend/TezosContent';
import { TxData } from 'app/pages/Send/modals/ConfirmSend/types';
import { useAnalytics } from 'lib/analytics';
import { ExchangeData } from 'lib/apis/exolix/types';
import { CrossChainAsset } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { EvmEstimationDataProvider, TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain, useAccount, useAccountForEvm, useAccountForTezos } from 'temple/front';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CrossChainAnalyticsEvents } from '../../analytics';
import backgroundFailedSrc from '../../assets/background-failed.svg?url';
import {
  buildCrossChainReservationCacheKey,
  useCrossChainExchangeReservation
} from '../../hooks/use-cross-chain-exchange-reservation';
import { useExchangeReservationExpiry } from '../../hooks/use-exchange-reservation-expiry';
import { useSubmitCrossChainExchange } from '../../hooks/use-submit-cross-chain-exchange';

import { CrossChainPreviewRows } from './CrossChainPreviewRows';
import { ExchangeSummaryCard } from './ExchangeSummaryCard';
import { StatusHeroRegion } from './StatusHeroRegion';
import { ConfirmCrossChainReviewData } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
}

export const PreviewContent: FC<Props> = ({ data, onSubmitted, onCancel }) => {
  const { fromAsset, fromAmount, recipient, toAsset } = data;

  const evmAccount = useAccountForEvm();
  const tezosAccount = useAccountForTezos();
  const evmNetwork = useEvmChainByChainId(Number(fromAsset.chainId ?? 0));
  const tezosNetwork = useTezosChainByChainId(String(fromAsset.chainId ?? ''));

  const senderAddress =
    fromAsset.chainKind === TempleChainKind.EVM
      ? evmAccount?.address
      : fromAsset.chainKind === TempleChainKind.Tezos
        ? tezosAccount?.address
        : undefined;

  const reservation = useCrossChainExchangeReservation({
    fromAsset,
    toAsset,
    fromAmount,
    recipient,
    refundAddress: senderAddress ?? ''
  });

  const { data: exchange, error, isLoading } = reservation;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const expired = useExchangeReservationExpiry(exchange?.createdAt);
  const isExpired = expired && !isSubmitting;

  const { cache: swrCache } = useSWRConfig();
  const expiryCacheKey = senderAddress
    ? unstable_serialize(
        buildCrossChainReservationCacheKey({
          fromAsset,
          toAsset,
          fromAmount,
          recipient,
          refundAddress: senderAddress
        })
      )
    : null;

  useEffect(() => {
    if (!isExpired || !expiryCacheKey) return;
    return () => swrCache.delete(expiryCacheKey);
  }, [isExpired, expiryCacheKey, swrCache]);

  const { trackEvent } = useAnalytics();

  const reportedExpiryRef = useRef(false);

  useEffect(() => {
    if (!isExpired || reportedExpiryRef.current) return;
    reportedExpiryRef.current = true;
    trackEvent(CrossChainAnalyticsEvents.CrossChainPreBroadcastExpired, undefined, {
      exchangeId: exchange?.id,
      fromCoin: fromAsset.exolixCoin,
      fromNetwork: fromAsset.exolixNetwork,
      toCoin: toAsset.exolixCoin,
      toNetwork: toAsset.exolixNetwork,
      amount: fromAmount,
      createdAt: exchange?.createdAt
    });
  }, [
    isExpired,
    trackEvent,
    exchange?.id,
    exchange?.createdAt,
    fromAsset.exolixCoin,
    fromAsset.exolixNetwork,
    toAsset.exolixCoin,
    toAsset.exolixNetwork,
    fromAmount
  ]);

  const lastReportedErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) {
      lastReportedErrorRef.current = null;
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    if (lastReportedErrorRef.current === message) return;
    lastReportedErrorRef.current = message;
    trackEvent(CrossChainAnalyticsEvents.CrossChainReservationFailed, undefined, {
      fromCoin: fromAsset.exolixCoin,
      fromNetwork: fromAsset.exolixNetwork,
      toCoin: toAsset.exolixCoin,
      toNetwork: toAsset.exolixNetwork,
      amount: fromAmount,
      message
    });
  }, [
    error,
    fromAsset.exolixCoin,
    fromAsset.exolixNetwork,
    toAsset.exolixCoin,
    toAsset.exolixNetwork,
    fromAmount,
    trackEvent
  ]);

  if (isLoading || (!exchange && !error)) {
    return <CenteredLoader />;
  }

  if (error || !exchange) {
    return <ReservationFailureView onClose={onCancel} onTryAgain={onCancel} />;
  }

  if (isExpired) {
    return (
      <OrderExpiredView
        onClose={onCancel}
        fromAsset={fromAsset}
        toAsset={toAsset}
        fromAmount={fromAmount}
        toAmountEstimated={data.toAmountEstimated}
        senderAddress={senderAddress}
        recipient={recipient}
        exolixId={exchange.id}
        sourceChainKind={fromAsset.chainKind!}
        sourceChainId={fromAsset.chainId ?? ''}
      />
    );
  }

  if (fromAsset.chainKind === TempleChainKind.EVM && evmAccount && evmNetwork) {
    return (
      <EvmEstimationDataProvider>
        <EvmPreviewBody
          data={data}
          exchange={exchange}
          account={evmAccount}
          network={evmNetwork}
          onSubmitted={onSubmitted}
          onCancel={onCancel}
          onSubmittingChange={setIsSubmitting}
        />
      </EvmEstimationDataProvider>
    );
  }

  if (fromAsset.chainKind === TempleChainKind.Tezos && tezosAccount && tezosNetwork) {
    return (
      <TezosEstimationDataProvider>
        <TezosPreviewBody
          data={data}
          exchange={exchange}
          account={tezosAccount}
          network={tezosNetwork}
          onSubmitted={onSubmitted}
          onCancel={onCancel}
          onSubmittingChange={setIsSubmitting}
        />
      </TezosEstimationDataProvider>
    );
  }

  return <ReservationFailureView onClose={onCancel} onTryAgain={onCancel} />;
};

interface PreviewBodyProps<TAccount, TNetwork> {
  data: ConfirmCrossChainReviewData;
  exchange: ExchangeData;
  account: TAccount;
  network: TNetwork;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
  onSubmittingChange: (isSubmitting: boolean) => void;
}

const EvmPreviewBody: FC<PreviewBodyProps<AccountForChain<TempleChainKind.EVM>, EvmChain>> = ({
  data,
  exchange,
  account,
  network,
  onSubmitted,
  onCancel,
  onSubmittingChange
}) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;
  const currentAccount = useAccount();
  const recordCrossChainExchange = useSubmitCrossChainExchange();
  const submittedRef = useRef(false);

  const reviewData: EvmReviewData = {
    account,
    network,
    assetSlug: fromAsset.assetSlug ?? '',
    to: exchange.depositAddress,
    amount: fromAmount,
    onConfirm: noop
  };

  const handleSuccess = ({ txHash }: TxData<TempleChainKind.EVM>) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordCrossChainExchange({
      accountId: currentAccount.id,
      sourceChainKind: TempleChainKind.EVM,
      sourceChainId: network.chainId,
      senderAddress: account.address,
      txHash,
      exchange,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      recipient
    });
    onSubmitted(exchange.id);
  };

  return (
    <EvmContent
      data={reviewData}
      onClose={onCancel}
      onSuccess={handleSuccess}
      detailsContent={<CrossChainPreviewRows recipient={recipient} fromAsset={fromAsset} toAsset={toAsset} />}
      silentEstimation
      suppressSubmitToast
      onSubmittingChange={onSubmittingChange}
    />
  );
};

const TezosPreviewBody: FC<PreviewBodyProps<AccountForChain<TempleChainKind.Tezos>, TezosChain>> = ({
  data,
  exchange,
  account,
  network,
  onSubmitted,
  onCancel,
  onSubmittingChange
}) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;
  const currentAccount = useAccount();
  const recordCrossChainExchange = useSubmitCrossChainExchange();
  const submittedRef = useRef(false);

  const assetMetadata = useCategorizedTezosAssetMetadata(fromAsset.assetSlug ?? '', network.chainId);

  const reviewData: TezosReviewData = {
    account,
    network,
    assetSlug: fromAsset.assetSlug ?? '',
    to: exchange.depositAddress,
    amount: fromAmount,
    onConfirm: noop
  };

  const handleSuccess = ({ txHash }: TxData<TempleChainKind.Tezos>) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordCrossChainExchange({
      accountId: currentAccount.id,
      sourceChainKind: TempleChainKind.Tezos,
      sourceChainId: network.chainId,
      senderAddress: account.address,
      txHash,
      exchange,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      recipient
    });
    onSubmitted(exchange.id);
  };

  if (!assetMetadata) {
    return <CenteredLoader />;
  }

  return (
    <TezosContent
      data={reviewData}
      onClose={onCancel}
      onSuccess={handleSuccess}
      detailsContent={<CrossChainPreviewRows recipient={recipient} fromAsset={fromAsset} toAsset={toAsset} />}
      suppressSubmitToast
      onSubmittingChange={onSubmittingChange}
    />
  );
};

const CenteredLoader: FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <Loader size="L" trackVariant="dark" className="text-secondary" />
  </div>
);

interface FailureProps {
  onClose: EmptyFn;
  onTryAgain: EmptyFn;
}

const ReservationFailureView: FC<FailureProps> = ({ onClose, onTryAgain }) => (
  <>
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 flex flex-col items-stretch">
      <StatusHeroRegion
        backgroundSrc={backgroundFailedSrc}
        outerClassName="h-48 px-4 pb-2"
        innerClassName="flex flex-col items-center gap-y-3 pb-4 pt-6"
      >
        <XCircleFill width={58} height={58} className="text-error fill-current" />
        <p className="text-font-regular-bold">{t('couldNotComplete')}</p>
        <p className="text-font-description text-grey-1 text-center whitespace-pre-line">
          {t('couldNotCompleteDescription')}
        </p>
      </StatusHeroRegion>
    </div>

    <ActionsButtonsBox flexDirection="row">
      <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
        <T id="close" />
      </StyledButton>
      <StyledButton size="L" className="w-full" color="primary" onClick={onTryAgain}>
        <T id="tryAgain" />
      </StyledButton>
    </ActionsButtonsBox>
  </>
);

interface OrderExpiredViewProps {
  onClose: EmptyFn;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  senderAddress?: string;
  recipient: string;
  exolixId: string;
  sourceChainKind: TempleChainKind;
  sourceChainId: string | number;
}

const OrderExpiredView: FC<OrderExpiredViewProps> = ({
  onClose,
  fromAsset,
  toAsset,
  fromAmount,
  toAmountEstimated,
  senderAddress,
  recipient,
  exolixId,
  sourceChainKind,
  sourceChainId
}) => (
  <>
    <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 flex flex-col items-stretch">
      <StatusHeroRegion
        backgroundSrc={backgroundFailedSrc}
        outerClassName="h-48 px-4 pb-2"
        innerClassName="flex flex-col items-center gap-y-3 pb-4 pt-6"
      >
        <XCircleFill width={58} height={58} className="text-error fill-current" />
        <p className="text-font-regular-bold">{t('orderExpiredCrossChain')}</p>
        <p className="text-font-description text-grey-1 text-center whitespace-pre-line">
          {t('orderExpiredCrossChainPreBroadcastDescription')}
        </p>
      </StatusHeroRegion>

      <ExchangeSummaryCard
        fromAsset={fromAsset}
        toAsset={toAsset}
        fromAmount={fromAmount}
        toAmountEstimated={toAmountEstimated}
        senderAddress={senderAddress}
        recipient={recipient}
        exolixId={exolixId}
        sourceChainKind={sourceChainKind}
        sourceChainId={sourceChainId}
        showEstimatedTime={false}
        hideDetails
      />
    </div>

    <ActionsButtonsBox>
      <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
        <T id="close" />
      </StyledButton>
    </ActionsButtonsBox>
  </>
);
