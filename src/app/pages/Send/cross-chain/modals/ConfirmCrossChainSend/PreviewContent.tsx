import React, { FC, memo, useEffect } from 'react';

import { Loader } from 'app/atoms';
import { CaptionAlert } from 'app/atoms/CaptionAlert';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { useAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useAccountForEvm, useAccountForTezos } from 'temple/front';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CrossChainAnalyticsEvents } from '../../analytics';
import { useCrossChainExchangeReservation } from '../../hooks/use-cross-chain-exchange-reservation';

import { PreviewBodyEvm } from './PreviewBodyEvm';
import { PreviewBodyTezos } from './PreviewBodyTezos';
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

  useEffect(() => {
    if (!error) return;
    trackEvent(CrossChainAnalyticsEvents.CrossChainReservationFailed, undefined, {
      fromCoin: fromAsset.exolixCoin,
      fromNetwork: fromAsset.exolixNetwork,
      toCoin: toAsset.exolixCoin,
      toNetwork: toAsset.exolixNetwork,
      amount: fromAmount,
      message: error instanceof Error ? error.message : String(error)
    });
  }, [error, fromAsset.exolixCoin, fromAsset.exolixNetwork, toAsset.exolixCoin, toAsset.exolixNetwork, fromAmount, trackEvent]);

  if (isLoading || (!exchange && !error)) {
    return <CenteredLoader />;
  }

  if (error || !exchange) {
    return <ReservationFailureView error={error} onClose={onCancel} />;
  }

  if (fromAsset.chainKind === TempleChainKind.EVM && evmAccount && evmNetwork) {
    return (
      <PreviewBodyEvm
        data={data}
        exchange={exchange}
        account={evmAccount}
        network={evmNetwork}
        onSubmitted={onSubmitted}
        onCancel={onCancel}
      />
    );
  }

  if (fromAsset.chainKind === TempleChainKind.Tezos && tezosAccount && tezosNetwork) {
    return (
      <PreviewBodyTezos
        data={data}
        exchange={exchange}
        account={tezosAccount}
        network={tezosNetwork}
        onSubmitted={onSubmitted}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ReservationFailureView error={new Error(t('crossChainSourceAccountUnavailable'))} onClose={onCancel} />
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
