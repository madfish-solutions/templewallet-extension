import { ExchangeData } from 'lib/apis/exolix/types';
import { createCrossChainExchange } from 'lib/apis/exolix/utils';
import { CrossChainAsset } from 'lib/cross-chain';
import { useTypedSWR } from 'lib/swr';

interface ReservationArgs {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  recipient: string;
}

/**
 * SWR cache key for an Exolix reservation. Exported so the post-broadcast bookkeeping can clear
 * the entry — once the reservation has been used, returning it from cache on a future Preview
 * mount would let the user broadcast against a closed deposit address.
 */
export const buildCrossChainReservationCacheKey = ({ fromAsset, toAsset, fromAmount, recipient }: ReservationArgs) =>
  [
    'cross-chain-reservation',
    fromAsset.exolixCoin,
    fromAsset.exolixNetwork,
    toAsset.exolixCoin,
    toAsset.exolixNetwork,
    fromAmount,
    recipient.trim()
  ] as const;

export const useCrossChainExchangeReservation = ({ fromAsset, toAsset, fromAmount, recipient }: ReservationArgs) => {
  const trimmedRecipient = recipient.trim();
  const enabled = Number(fromAmount) > 0 && trimmedRecipient.length > 0;

  const key = enabled ? buildCrossChainReservationCacheKey({ fromAsset, toAsset, fromAmount, recipient }) : null;

  return useTypedSWR<ExchangeData>(
    key,
    async () =>
      createCrossChainExchange({
        coinFrom: fromAsset.exolixCoin,
        networkFrom: fromAsset.exolixNetwork,
        coinTo: toAsset.exolixCoin,
        networkTo: toAsset.exolixNetwork,
        amount: fromAmount,
        withdrawalAddress: trimmedRecipient
      }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      dedupingInterval: 5 * 60 * 1000
    }
  );
};
