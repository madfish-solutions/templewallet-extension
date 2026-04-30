import { createCrossChainExchange } from 'lib/apis/exolix/cross-chain';
import { ExchangeData } from 'lib/apis/exolix/types';
import { CrossChainAsset } from 'lib/cross-chain';
import { useTypedSWR } from 'lib/swr';

interface ReservationArgs {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  recipient: string;
  /** Dev hook: when true, the SWR call throws so the failure UI can be inspected. */
  forceError?: boolean;
}

export const useCrossChainExchangeReservation = ({
  fromAsset,
  toAsset,
  fromAmount,
  recipient,
  forceError
}: ReservationArgs) => {
  const trimmedRecipient = recipient.trim();
  const parsedAmount = Number(fromAmount);
  const enabled = parsedAmount > 0 && trimmedRecipient.length > 0;

  const key = enabled
    ? [
        'cross-chain-reservation',
        fromAsset.exolixCoin,
        fromAsset.exolixNetwork,
        toAsset.exolixCoin,
        toAsset.exolixNetwork,
        parsedAmount,
        trimmedRecipient,
        forceError ? 'forced-error' : 'normal'
      ]
    : null;

  return useTypedSWR<ExchangeData>(
    key,
    async () => {
      if (forceError) {
        throw new Error('Forced reservation failure (dev panel).');
      }
      return createCrossChainExchange({
        coinFrom: fromAsset.exolixCoin,
        networkFrom: fromAsset.exolixNetwork,
        coinTo: toAsset.exolixCoin,
        networkTo: toAsset.exolixNetwork,
        amount: parsedAmount,
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
