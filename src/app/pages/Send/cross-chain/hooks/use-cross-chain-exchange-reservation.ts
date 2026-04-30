import { ExchangeData } from 'lib/apis/exolix/types';
import { createCrossChainExchange } from 'lib/apis/exolix/utils';
import { CrossChainAsset } from 'lib/cross-chain';
import { IS_DEV_ENV } from 'lib/env';
import { useTypedSWR } from 'lib/swr';

interface ReservationArgs {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  recipient: string;
  /** Dev hook: when true, the SWR call throws so the failure UI can be inspected. Tree-shaken in prod. */
  forceError?: boolean;
}

export const useCrossChainExchangeReservation = ({
  fromAsset,
  toAsset,
  fromAmount,
  recipient,
  forceError
}: ReservationArgs) => {
  const devForceError = IS_DEV_ENV && Boolean(forceError);
  const trimmedRecipient = recipient.trim();
  const enabled = Number(fromAmount) > 0 && trimmedRecipient.length > 0;

  const key = enabled
    ? [
        'cross-chain-reservation',
        fromAsset.exolixCoin,
        fromAsset.exolixNetwork,
        toAsset.exolixCoin,
        toAsset.exolixNetwork,
        fromAmount,
        trimmedRecipient,
        devForceError ? 'forced-error' : 'normal'
      ]
    : null;

  return useTypedSWR<ExchangeData>(
    key,
    async () => {
      if (devForceError) {
        throw new Error('Forced reservation failure (dev panel).');
      }
      return createCrossChainExchange({
        coinFrom: fromAsset.exolixCoin,
        networkFrom: fromAsset.exolixNetwork,
        coinTo: toAsset.exolixCoin,
        networkTo: toAsset.exolixNetwork,
        amount: fromAmount,
        withdrawalAddress: trimmedRecipient
      });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 5 * 60 * 1000
    }
  );
};
