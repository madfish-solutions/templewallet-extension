import { useCallback } from 'react';

import { dispatch } from 'app/store';
import { addCrossChainExchangeAction, monitorCrossChainExchangesAction } from 'app/store/cross-chain-send/actions';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { ExchangeData } from 'lib/apis/exolix/types';
import { useAnalytics } from 'lib/analytics';
import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

import { CrossChainAnalyticsEvents } from '../analytics';

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
        depositExtraId: exchange.depositExtraId,
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
    [trackEvent]
  );
};
