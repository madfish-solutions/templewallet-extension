import { useEffect, useRef } from 'react';

import { useAllCrossChainExchangesSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { toastError, toastSuccess } from 'app/toaster';
import { useAnalytics } from 'lib/analytics';
import { isTerminalPhase } from 'lib/cross-chain';
import { t } from 'lib/i18n';

import { CrossChainAnalyticsEvents } from '../analytics';

export const useCrossChainToast = () => {
  const exchanges = useAllCrossChainExchangesSelector();
  const previousPhasesRef = useRef<Record<string, CrossChainPhase>>({});
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const previous = previousPhasesRef.current;
    const seen = new Set<string>();

    for (const exchange of exchanges) {
      seen.add(exchange.id);
      const prevPhase = previous[exchange.id];
      const nowTerminal = isTerminalPhase(exchange.phase);
      const wasTerminal = prevPhase ? isTerminalPhase(prevPhase) : false;

      if (prevPhase && !wasTerminal && nowTerminal) {
        if (exchange.phase === 'COMPLETED') {
          toastSuccess(t('crossChainSendCompletedToast'));
        } else {
          toastError(t('crossChainSendFailedToast'));
        }
        trackEvent(CrossChainAnalyticsEvents.CrossChainStatusChanged, undefined, {
          exchangeId: exchange.id,
          phase: exchange.phase,
          exolixStatus: exchange.exolixStatus
        });
      }

      previous[exchange.id] = exchange.phase;
    }

    for (const id of Object.keys(previous)) {
      if (!seen.has(id)) delete previous[id];
    }
  }, [exchanges, trackEvent]);
};
