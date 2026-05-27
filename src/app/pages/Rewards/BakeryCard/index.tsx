import { FC, useState, useTransition } from 'react';

import clsx from 'clsx';

import { Button, Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { DelegationModal } from 'app/pages/EarnTez/modals/delegation';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TKEY_TOKEN_METADATA } from 'lib/assets/known-tokens';
import { TEMPLE_BAKERY_REWARDS_STATS_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { TEMPLE_BAKER_ADDRESS } from 'lib/known-bakers';
import { useDelegate } from 'lib/temple/front';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import { navigate } from 'lib/woozie';
import { useAccountForTezos, useTezosMainnetChain } from 'temple/front';
import { confirmTezosOperation, getTezosReadOnlyRpcClient } from 'temple/tezos';

import { AllTimeStats } from '../all-time-stats';
import { TEMPLE_BAKERY_PAYOUT_ADDRESS } from '../constants';
import { useRewardsStatsEntry } from '../use-rewards-stats-entry';

import { BakeryCardSelectors } from './selectors';

const tkeyMeta = {
  contract: TKEY_TOKEN_METADATA.address,
  tokenId: TKEY_TOKEN_METADATA.id,
  decimals: TKEY_TOKEN_METADATA.decimals
};

export const BakeryCard: FC = () => {
  const tezosMainnet = useTezosMainnetChain();
  const account = useAccountForTezos();
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();
  const { trackEvent } = useAnalytics();

  const [isDelegationOpen, setDelegationOpen] = useState(false);
  const closeDelegation = () => setDelegationOpen(false);

  const [isDelegating, startDelegation] = useTransition();
  const { data: myBakerPkh, mutate: updateBakerPkh } = useDelegate(account?.address ?? '', tezosMainnet, false, true);
  const delegatedToTemple = myBakerPkh === TEMPLE_BAKER_ADDRESS;

  const { isLoading, stats } = useRewardsStatsEntry(
    TEMPLE_BAKERY_REWARDS_STATS_STORAGE_KEY,
    TEMPLE_BAKERY_PAYOUT_ADDRESS,
    account?.address,
    tkeyMeta,
    'Failed to load bakery stats: '
  );

  if (!account) return null;

  const handleClick = () => {
    if (isDelegating) return;
    if (!delegatedToTemple) {
      trackEvent(BakeryCardSelectors.confirmationTrigger, AnalyticsEventCategory.ButtonPress);
      setDelegationOpen(true);
      return;
    }
    navigate(`/earn-tez/${tezosMainnet.chainId}`);
  };

  const handleDelegationSuccess = (opHash: string) => {
    startDelegation(async () => {
      try {
        await confirmTezosOperation(getTezosReadOnlyRpcClient(tezosMainnet), opHash, 2);
        await updateBakerPkh();
      } catch (err) {
        console.error('Failed to confirm successful delegation: ', err);
      }
    });
  };

  const renderContent = () => {
    if (!delegatedToTemple) {
      return (
        <>
          <div className="w-full px-2 flex flex-col gap-3">
            <div className="pl-1 w-full flex items-center justify-between h-6">
              <span className="text-font-description-bold">{t('bakery')}</span>
              <AnimatedMenuChevron ref={animatedChevronRef} />
            </div>
            <p className="pl-1 w-full text-font-description">{t('bakeryDescription')}</p>
          </div>
          <span className="w-full bg-secondary-hover-low text-secondary text-font-num-bold-10 text-center p-2">
            {t('apyOnTez')}
          </span>
        </>
      );
    }

    if (isLoading) {
      return (
        <>
          <div className="w-full px-2 flex items-center justify-between">
            <span className="text-font-description-bold">{t('bakery')}</span>
            <AnimatedMenuChevron ref={animatedChevronRef} />
          </div>
          <div className="flex-1 w-full flex justify-center items-center pb-3">
            <Loader size="L" trackVariant="dark" className="text-secondary" />
          </div>
        </>
      );
    }

    return (
      <div className="w-full px-2 flex flex-col gap-2">
        <div className="w-full flex items-center justify-between">
          <span className="text-font-description-bold">{t('bakery')}</span>
          <AnimatedMenuChevron ref={animatedChevronRef} />
        </div>
        <AllTimeStats total={stats?.total} lastAmount={stats?.lastAmount} unit="TKEY" />
      </div>
    );
  };

  return (
    <>
      <Button
        onClick={handleClick}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        className={clsx(
          'flex-1 bg-white rounded-8 border-0.5 border-lines text-left flex flex-col gap-2 items-start overflow-clip transition-colors min-h-29',
          !delegatedToTemple ? 'pt-3' : 'py-3',
          !isDelegating && 'hover:bg-grey-4'
        )}
      >
        {renderContent()}
      </Button>

      {isDelegationOpen && (
        <DelegationModal
          network={tezosMainnet}
          account={account}
          directBakerPkh={TEMPLE_BAKER_ADDRESS}
          onDelegationSuccess={handleDelegationSuccess}
          onClose={closeDelegation}
        />
      )}
    </>
  );
};
