import { useCallback } from 'react';

import { unstable_serialize, useSWRConfig } from 'swr';

import { dispatch } from 'app/store';
import { addCrossChainExchangeAction, monitorCrossChainExchangesAction } from 'app/store/cross-chain-send/actions';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { useAnalytics } from 'lib/analytics';
import { ExchangeData } from 'lib/apis/exolix/types';
import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

import { CrossChainAnalyticsEvents } from '../analytics';

import { buildCrossChainReservationCacheKey } from './use-cross-chain-exchange-reservation';

interface RecordExchangeArgs {
  accountId: string;
  sourceChainKind: TempleChainKind;
  sourceChainId: string | number;
  senderAddress: string;
  txHash: string;
  exchange: ExchangeData;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  recipient: string;
}

export const useSubmitCrossChainExchange = () => {
  const { trackEvent } = useAnalytics();
  const { cache: swrCache } = useSWRConfig();

  return useCallback(
    ({
      accountId,
      sourceChainKind,
      sourceChainId,
      senderAddress,
      txHash,
      exchange,
      fromAsset,
      toAsset,
      fromAmount,
      toAmountEstimated,
      recipient
    }: RecordExchangeArgs) => {
      const now = Date.now();

      const storedExchange: CrossChainExchange = {
        id: exchange.id,
        accountId,
        sourceChainKind,
        sourceChainId,
        senderAddress,
        sourceTxHash: txHash,
        depositAddress: exchange.depositAddress,
        depositExtraId: exchange.depositExtraId ?? null,
        recipient: recipient.trim(),
        fromAsset,
        toAsset,
        fromAmount,
        toAmountEstimated,
        phase: 'PENDING_TX',
        exolixStatus: exchange.status,
        createdAt: now,
        updatedAt: now
      };

      dispatch(addCrossChainExchangeAction(storedExchange));
      dispatch(monitorCrossChainExchangesAction());

      // The reservation just got broadcast — its deposit address is now closed on Exolix's side
      // (or will be once the deposit lands). Drop the SWR cache entry so a future Preview mount
      // with the same form inputs creates a brand-new order instead of reusing this one.
      swrCache.delete(
        unstable_serialize(buildCrossChainReservationCacheKey({ fromAsset, toAsset, fromAmount, recipient }))
      );

      trackEvent(CrossChainAnalyticsEvents.CrossChainConfirmed, undefined, {
        exchangeId: exchange.id,
        from: fromAsset.exolixCoin,
        fromNetwork: fromAsset.exolixNetwork,
        to: toAsset.exolixCoin,
        toNetwork: toAsset.exolixNetwork,
        amount: fromAmount
      });

      return storedExchange;
    },
    [trackEvent, swrCache]
  );
};
