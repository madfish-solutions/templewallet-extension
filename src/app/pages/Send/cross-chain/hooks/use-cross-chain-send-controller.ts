import { useCallback, useState } from 'react';

import { useHasActiveCrossChainExchangesSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { useAnalytics } from 'lib/analytics';
import { CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY } from 'lib/cross-chain';
import { useBooleanState } from 'lib/ui/hooks';
import { useLocalStorage } from 'lib/ui/local-storage';
import { useAccount } from 'temple/front';

import { CrossChainAnalyticsEvents } from '../analytics';
import { ConfirmCrossChainReviewData, ConfirmCrossChainStep } from '../modals/ConfirmCrossChainSend/types';
import { SendTab } from '../components/SendTabs';

interface UseCrossChainSendControllerArgs {
  activeTab: SendTab;
}

export const useCrossChainSendController = ({ activeTab }: UseCrossChainSendControllerArgs) => {
  const [crossChainReview, setCrossChainReview] = useState<ConfirmCrossChainReviewData | undefined>();
  const [crossChainInitialStep, setCrossChainInitialStep] = useState<ConfirmCrossChainStep | undefined>();
  const [crossChainInitialExchangeId, setCrossChainInitialExchangeId] = useState<string | undefined>();

  const [crossChainConfirmOpened, openCrossChainConfirm, closeCrossChainConfirm] = useBooleanState(false);
  const [crossChainWarningOpened, openCrossChainWarning, closeCrossChainWarning] = useBooleanState(false);
  const [crossChainActivityOpened, openCrossChainActivity, closeCrossChainActivity] = useBooleanState(false);

  const [warningDismissed] = useLocalStorage<boolean>(CROSS_CHAIN_WARNING_DISMISSED_STORAGE_KEY, false);
  const currentAccount = useAccount();
  const accountId = currentAccount?.id;
  const hasActiveCrossChain = useHasActiveCrossChainExchangesSelector(accountId);

  const { trackEvent } = useAnalytics();

  const handleReview = useCallback(
    (data: ConfirmCrossChainReviewData) => {
      setCrossChainReview(data);
      trackEvent(CrossChainAnalyticsEvents.CrossChainReviewed, undefined, {
        from: data.fromAsset.exolixCoin,
        fromNetwork: data.fromAsset.exolixNetwork,
        to: data.toAsset.exolixCoin,
        toNetwork: data.toAsset.exolixNetwork,
        amount: data.fromAmount
      });
      if (warningDismissed) {
        openCrossChainConfirm();
      } else {
        trackEvent(CrossChainAnalyticsEvents.CrossChainWarningShown);
        openCrossChainWarning();
      }
    },
    [warningDismissed, openCrossChainConfirm, openCrossChainWarning, trackEvent]
  );

  const handleWarningConfirm = useCallback(() => {
    trackEvent(CrossChainAnalyticsEvents.CrossChainWarningDismissed);
    closeCrossChainWarning();
    openCrossChainConfirm();
  }, [closeCrossChainWarning, openCrossChainConfirm, trackEvent]);

  const handleOpenActivity = useCallback(() => {
    trackEvent(CrossChainAnalyticsEvents.CrossChainActivityOpened);
    openCrossChainActivity();
  }, [openCrossChainActivity, trackEvent]);

  const handleActivityClick = useCallback(
    (exchange: CrossChainExchange) => {
      closeCrossChainActivity();
      setCrossChainReview({
        fromAsset: exchange.fromAsset,
        toAsset: exchange.toAsset,
        fromAmount: exchange.fromAmount,
        toAmountEstimated: exchange.toAmountEstimated,
        recipient: exchange.recipient
      });
      setCrossChainInitialExchangeId(exchange.id);
      setCrossChainInitialStep(
        exchange.phase === 'COMPLETED'
          ? ConfirmCrossChainStep.Completed
          : exchange.phase === 'FAILED'
            ? ConfirmCrossChainStep.Failed
            : ConfirmCrossChainStep.Processing
      );
      openCrossChainConfirm();
    },
    [closeCrossChainActivity, openCrossChainConfirm]
  );

  const handleConfirmClose = useCallback(() => {
    closeCrossChainConfirm();
    setCrossChainInitialStep(undefined);
    setCrossChainInitialExchangeId(undefined);
  }, [closeCrossChainConfirm]);

  const handleTryAgain = useCallback(() => {
    trackEvent(CrossChainAnalyticsEvents.CrossChainTryAgain);
  }, [trackEvent]);

  const handleTabChange = useCallback(
    (tab: SendTab) => {
      if (tab === 'cross-chain' && activeTab !== 'cross-chain') {
        trackEvent(CrossChainAnalyticsEvents.CrossChainTabOpened);
      }
    },
    [activeTab, trackEvent]
  );

  return {
    accountId,
    hasActiveCrossChain,
    crossChainReview,
    crossChainInitialStep,
    crossChainInitialExchangeId,
    crossChainConfirmOpened,
    crossChainWarningOpened,
    crossChainActivityOpened,
    closeCrossChainWarning,
    closeCrossChainActivity,
    handleReview,
    handleWarningConfirm,
    handleOpenActivity,
    handleActivityClick,
    handleConfirmClose,
    handleTryAgain,
    handleTabChange
  };
};
