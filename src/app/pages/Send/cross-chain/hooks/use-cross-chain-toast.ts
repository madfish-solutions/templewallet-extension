import { useEffect, useRef } from 'react';

import { useAllCrossChainExchangesSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { toastError, toastSuccess } from 'app/toaster';
import { useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';

import { CrossChainAnalyticsEvents } from '../analytics';

const TERMINAL_PHASES: CrossChainPhase[] = ['COMPLETED', 'FAILED'];

export const useCrossChainToast = () => {
  const exchanges = useAllCrossChainExchangesSelector();
  const previousPhasesRef = useRef<Record<string, CrossChainPhase>>({});
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const previous = previousPhasesRef.current;

    for (const exchange of exchanges) {
      const prevPhase = previous[exchange.id];
      const nowTerminal = TERMINAL_PHASES.includes(exchange.phase);
      const wasTerminal = prevPhase ? TERMINAL_PHASES.includes(prevPhase) : false;

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
  }, [exchanges, trackEvent]);
};
