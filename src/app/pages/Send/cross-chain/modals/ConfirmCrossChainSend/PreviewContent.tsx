import React, { FC, memo, useCallback } from 'react';

import { Loader } from 'app/atoms';
import { CaptionAlert } from 'app/atoms/CaptionAlert';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';
import { useAccountForEvm, useAccountForTezos } from 'temple/front';
import { useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useCrossChainExchangeReservation } from '../../hooks/use-cross-chain-exchange-reservation';

import { PreviewBodyEvm } from './PreviewBodyEvm';
import { PreviewBodyTezos } from './PreviewBodyTezos';
import { ConfirmCrossChainReviewData, ConfirmCrossChainStep } from './types';

interface Props {
  data: ConfirmCrossChainReviewData;
  onStepChange: (step: ConfirmCrossChainStep, exchangeId: string) => void;
  onCancel: EmptyFn;
  /** Dev-only: force the reservation SWR call to fail so the failure UI can be inspected. */
  devForceReservationError?: boolean;
}

export const PreviewContent: FC<Props> = ({ data, onStepChange, onCancel, devForceReservationError }) => {
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

  const { data: exchange, error, isLoading, mutate } = reservation;
  const handleRetry = useCallback(() => mutate(), [mutate]);

  if (isLoading || (!exchange && !error)) {
    return <CenteredLoader />;
  }

  if (error || !exchange) {
    return <ReservationFailureView error={error} onRetry={handleRetry} onCancel={onCancel} />;
  }

  if (fromAsset.chainKind === TempleChainKind.EVM && evmAccount && evmNetwork) {
    return (
      <PreviewBodyEvm
        data={data}
        exchange={exchange}
        account={evmAccount}
        network={evmNetwork}
        onStepChange={onStepChange}
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
        onStepChange={onStepChange}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ReservationFailureView
      error={new Error(t('crossChainSourceAccountUnavailable'))}
      onRetry={handleRetry}
      onCancel={onCancel}
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
  onRetry: EmptyFn;
  onCancel: EmptyFn;
}

const ReservationFailureView = memo<FailureProps>(({ error, onRetry, onCancel }) => {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : t('couldNotStartExchangeDescription');

  return (
    <>
      <div className="flex-1 px-4 pt-6 pb-4 flex flex-col gap-y-4">
        <CaptionAlert
          type="error"
          title={t('couldNotStartExchange')}
          message={t('couldNotStartExchangeDescription')}
        />
        <p className="text-font-small text-grey-1 wrap-break-word">{message}</p>
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onCancel}>
          <T id="cancel" />
        </StyledButton>
        <StyledButton size="L" className="w-full" color="primary" onClick={onRetry}>
          <T id="retry" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
});
