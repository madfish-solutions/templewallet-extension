import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { Button, Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { useBakeryRewardsStats } from 'app/hooks/use-rewards-stats';
import { DelegationModal } from 'app/pages/EarnTez/modals/delegation';
import { useHasPendingTezosDelegation } from 'app/store/tezos/pending-transactions/utils';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import { TEMPLE_BAKER_ADDRESS } from 'lib/known-bakers';
import { useDelegate } from 'lib/temple/front';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { navigate } from 'lib/woozie';
import { useAccountForTezos, useOnTezosBlock, useTezosMainnetChain } from 'temple/front';

import { AllTimeStats } from '../all-time-stats';

import { BakeryCardSelectors } from './selectors';

export const BakeryCard: FC = () => {
  const tezosMainnet = useTezosMainnetChain();
  const account = useAccountForTezos();
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();
  const { trackEvent } = useAnalytics();

  const [isDelegationOpen, setDelegationOpen] = useState(false);
  const closeDelegation = () => setDelegationOpen(false);

  const { data: myBakerPkh, mutate: updateBakerPkh } = useDelegate(account?.address ?? '', tezosMainnet, false, true);
  const delegatedToTemple = myBakerPkh === TEMPLE_BAKER_ADDRESS;

  const hasPendingDelegation = useHasPendingTezosDelegation(account?.address ?? '', tezosMainnet.chainId);

  const [bakerChecked, setBakerChecked] = useState(false);

  useEffect(() => {
    void updateBakerPkh().finally(() => setBakerChecked(true));
  }, [updateBakerPkh]);

  useOnTezosBlock(tezosMainnet, () => void updateBakerPkh());

  const [isSettlingDelegation, setIsSettlingDelegation] = useState(false);
  const hadPendingDelegationRef = useRef(hasPendingDelegation);
  const bakerBeforeDelegationRef = useRef(myBakerPkh);

  useLayoutEffect(() => {
    const wasPending = hadPendingDelegationRef.current;
    if (!wasPending && hasPendingDelegation) {
      bakerBeforeDelegationRef.current = myBakerPkh;
    } else if (wasPending && !hasPendingDelegation) {
      setIsSettlingDelegation(true);
    }
    hadPendingDelegationRef.current = hasPendingDelegation;
  }, [hasPendingDelegation, myBakerPkh]);

  useEffect(() => {
    if (!isSettlingDelegation) return;
    if (myBakerPkh !== bakerBeforeDelegationRef.current) {
      setIsSettlingDelegation(false);
      return;
    }
    const intervalId = setInterval(() => void updateBakerPkh(), 3000);
    const timeoutId = setTimeout(() => setIsSettlingDelegation(false), 15000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isSettlingDelegation, myBakerPkh, updateBakerPkh]);

  const { isLoading, stats } = useBakeryRewardsStats();

  if (!account) return null;

  const getView = () => {
    if (hasPendingDelegation || isSettlingDelegation || myBakerPkh === undefined) return 'loader';
    if (!delegatedToTemple) return 'promo';
    if (isLoading || !bakerChecked) return 'loader';
    return 'stats';
  };
  const view = getView();

  const handleClick = () => {
    if (view === 'loader') return;
    if (!delegatedToTemple) {
      trackEvent(BakeryCardSelectors.confirmationTrigger, AnalyticsEventCategory.ButtonPress);
      setDelegationOpen(true);
      return;
    }
    navigate(`/earn-tez/${tezosMainnet.chainId}`);
  };

  const renderContent = () => {
    if (view === 'promo') {
      return (
        <>
          <div className="w-full px-2 flex flex-col gap-2">
            <div className="pl-1 w-full flex items-center justify-between h-6">
              <span className="text-font-description-bold">{t('bakery')}</span>
              <AnimatedMenuChevron ref={animatedChevronRef} />
            </div>
            <p className="pl-1 w-full text-font-description">{t('bakeryDescription')}</p>
          </div>
          <span className="w-full mt-auto bg-secondary-hover-low text-secondary text-font-num-bold-10 text-center p-2">
            {t('apyOnTez')}
          </span>
        </>
      );
    }

    if (view === 'loader') {
      return (
        <>
          <div className="w-full pl-3 pr-2 flex items-center justify-between">
            <span className="text-font-description-bold">{t('bakery')}</span>
            <AnimatedMenuChevron ref={animatedChevronRef} />
          </div>
          <div className="flex-1 w-full flex justify-center items-center">
            <Loader size="L" trackVariant="dark" className="text-secondary" />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="w-full pl-3 pr-2 flex items-center justify-between">
          <span className="text-font-description-bold">{t('bakery')}</span>
          <AnimatedMenuChevron ref={animatedChevronRef} />
        </div>
        <div className="w-full pl-3 pr-2 mt-auto">
          <AllTimeStats total={stats?.total} lastAmount={stats?.lastAmount} unit="TKEY" />
        </div>
      </>
    );
  };

  return (
    <>
      <Button
        onClick={handleClick}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        className={clsx(
          'flex-1 bg-white rounded-8 border-0.5 border-lines text-left flex flex-col items-start overflow-clip transition-colors min-h-29',
          view === 'promo' ? 'gap-3 pt-3' : 'gap-2 py-3',
          view !== 'loader' && 'hover:bg-grey-4'
        )}
      >
        {renderContent()}
      </Button>

      {isDelegationOpen && (
        <DelegationModal
          network={tezosMainnet}
          account={account}
          directBakerPkh={TEMPLE_BAKER_ADDRESS}
          onClose={closeDelegation}
        />
      )}
    </>
  );
};
