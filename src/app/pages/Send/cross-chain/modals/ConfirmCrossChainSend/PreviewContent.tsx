import React, { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Loader } from 'app/atoms';
import { CaptionAlert } from 'app/atoms/CaptionAlert';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { EvmReviewData, TezosReviewData } from 'app/pages/Send/form/interfaces';
import { EvmContent } from 'app/pages/Send/modals/ConfirmSend/EvmContent';
import { TezosContent } from 'app/pages/Send/modals/ConfirmSend/TezosContent';
import { TxData } from 'app/pages/Send/modals/ConfirmSend/types';
import { useAnalytics } from 'lib/analytics';
import { ExchangeData } from 'lib/apis/exolix/types';
import { T, t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata } from 'lib/metadata';
import { EvmEstimationDataProvider, TezosEstimationDataProvider } from 'lib/temple/front/estimation-data-providers';
import { AccountForChain } from 'temple/accounts';
import { EvmChain, TezosChain, useAccount, useAccountForEvm, useAccountForTezos } from 'temple/front';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CrossChainAnalyticsEvents } from '../../analytics';
import { useCrossChainExchangeReservation } from '../../hooks/use-cross-chain-exchange-reservation';
import { useSubmitCrossChainExchange } from '../../hooks/use-submit-cross-chain-exchange';

import { CrossChainPreviewRows } from './CrossChainPreviewRows';
import { ConfirmCrossChainReviewData } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
  /** Dev-only: force the reservation SWR call to fail so the failure UI can be inspected. */
  devForceReservationError?: boolean;
}

export const PreviewContent: FC<Props> = ({ data, onSubmitted, onCancel, devForceReservationError }) => {
  const { fromAsset, fromAmount, recipient, toAsset } = data;

  const evmAccount = useAccountForEvm();
  const tezosAccount = useAccountForTezos();
  const evmNetwork = useEvmChainByChainId(Number(fromAsset.chainId ?? 0));
  const tezosNetwork = useTezosChainByChainId(String(fromAsset.chainId ?? ''));

  const reservation = useCrossChainExchangeReservation({
    fromAsset,
    toAsset,
    fromAmount,
    recipient,
    forceError: devForceReservationError
  });

  const { data: exchange, error, isLoading } = reservation;

  const { trackEvent } = useAnalytics();

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
    return <ReservationFailureView error={error} onClose={onCancel} />;
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
        />
      </TezosEstimationDataProvider>
    );
  }

  return <ReservationFailureView error={new Error(t('crossChainSourceAccountUnavailable'))} onClose={onCancel} />;
};

interface PreviewBodyProps<TAccount, TNetwork> {
  data: ConfirmCrossChainReviewData;
  exchange: ExchangeData;
  account: TAccount;
  network: TNetwork;
  onSubmitted: (exchangeId: string) => void;
  onCancel: EmptyFn;
}

const EvmPreviewBody: FC<PreviewBodyProps<AccountForChain<TempleChainKind.EVM>, EvmChain>> = ({
  data,
  exchange,
  account,
  network,
  onSubmitted,
  onCancel
}) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;
  const currentAccount = useAccount();
  const recordCrossChainExchange = useSubmitCrossChainExchange();
  const submittedRef = useRef(false);

  const reviewData = useMemo<EvmReviewData>(
    () => ({
      account,
      network,
      assetSlug: fromAsset.assetSlug ?? '',
      to: exchange.depositAddress,
      amount: fromAmount,
      onConfirm: () => {}
    }),
    [account, network, fromAsset.assetSlug, exchange.depositAddress, fromAmount]
  );

  const handleSuccess = useCallback(
    ({ txHash }: TxData<TempleChainKind.EVM>) => {
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
    },
    [
      currentAccount.id,
      network.chainId,
      account.address,
      exchange,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      recipient,
      recordCrossChainExchange,
      onSubmitted
    ]
  );

  return (
    <EvmContent
      data={reviewData}
      onClose={onCancel}
      onSuccess={handleSuccess}
      detailsContent={<CrossChainPreviewRows recipient={recipient} fromAsset={fromAsset} toAsset={toAsset} />}
      silentEstimation
      suppressSubmitToast
    />
  );
};

const TezosPreviewBody: FC<PreviewBodyProps<AccountForChain<TempleChainKind.Tezos>, TezosChain>> = ({
  data,
  exchange,
  account,
  network,
  onSubmitted,
  onCancel
}) => {
  const { fromAsset, toAsset, fromAmount, toAmountEstimated, recipient } = data;
  const currentAccount = useAccount();
  const recordCrossChainExchange = useSubmitCrossChainExchange();
  const submittedRef = useRef(false);

  const assetMetadata = useCategorizedTezosAssetMetadata(fromAsset.assetSlug ?? '', network.chainId);

  const reviewData = useMemo<TezosReviewData>(
    () => ({
      account,
      network,
      assetSlug: fromAsset.assetSlug ?? '',
      to: exchange.depositAddress,
      amount: fromAmount,
      onConfirm: () => {}
    }),
    [account, network, fromAsset.assetSlug, exchange.depositAddress, fromAmount]
  );

  const handleSuccess = useCallback(
    ({ txHash }: TxData<TempleChainKind.Tezos>) => {
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
    },
    [
      currentAccount.id,
      network.chainId,
      account.address,
      exchange,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      recipient,
      recordCrossChainExchange,
      onSubmitted
    ]
  );

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
    />
  );
};

const CenteredLoader = memo(() => (
  <div className="flex-1 flex items-center justify-center">
    <Loader size="L" trackVariant="dark" className="text-secondary" />
  </div>
));

interface FailureProps {
  error: unknown;
  onClose: EmptyFn;
}

const ReservationFailureView = memo<FailureProps>(({ error, onClose }) => {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : t('couldNotStartExchangeDescription');

  return (
    <>
      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-y-4">
        <CaptionAlert type="error" title={t('couldNotStartExchange')} message={t('couldNotStartExchangeDescription')} />
        <p className="text-font-small text-grey-1 wrap-break-word">{message}</p>
      </div>

      <ActionsButtonsBox shouldChangeBottomShift={false}>
        <StyledButton size="L" color="primary" onClick={onClose}>
          <T id="close" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
});
