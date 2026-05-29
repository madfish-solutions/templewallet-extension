import { FC } from 'react';

import { Button, IconBase, Loader } from 'app/atoms';
import { AnimatedMenuChevron } from 'app/atoms/animated-menu-chevron';
import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { useRewardsAddresses } from 'app/hooks/use-rewards-addresses';
import { ReactComponent as InfoIcon } from 'app/icons/base/InfoFill.svg';
import { TKEY_TOKEN_METADATA } from 'lib/assets/known-tokens';
import { TKEY_REWARDS_STATS_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { useActivateAnimatedChevron } from 'lib/ui/hooks/use-activate-animated-chevron';
import useTippy from 'lib/ui/useTippy';
import { navigate } from 'lib/woozie';

import { AllTimeStats } from '../all-time-stats';
import { TEMPLE_REWARDS_PAYOUT_ADDRESS } from '../constants';
import { promoInfoTippyProps } from '../tooltip';
import { useRewardsStatsEntry } from '../use-rewards-stats-entry';

import { PromoCardSelectors } from './selectors';

const tkeyMeta = {
  contract: TKEY_TOKEN_METADATA.address,
  tokenId: TKEY_TOKEN_METADATA.id,
  decimals: TKEY_TOKEN_METADATA.decimals
};

const PromoInfoIcon: FC = () => {
  const ref = useTippy<HTMLDivElement>(promoInfoTippyProps);
  return <IconBase ref={ref} size={16} Icon={InfoIcon} className="text-grey-2" />;
};

export const PromoCard: FC = () => {
  const { isEnabled } = usePartnersPromotionSettings();
  const { animatedChevronRef, handleHover, handleUnhover } = useActivateAnimatedChevron();
  const { tezosAddress: rewardsAddress } = useRewardsAddresses();

  const { isLoading, stats } = useRewardsStatsEntry(
    TKEY_REWARDS_STATS_STORAGE_KEY,
    TEMPLE_REWARDS_PAYOUT_ADDRESS,
    rewardsAddress,
    tkeyMeta,
    'Failed to load Tkey stats: '
  );

  if (!isEnabled) {
    return (
      <Button
        testID={PromoCardSelectors.card}
        onClick={() => navigate('/rewards/promo/activate')}
        onMouseEnter={handleHover}
        onMouseLeave={handleUnhover}
        className="flex-1 bg-white border-0.5 border-lines rounded-8 overflow-clip pt-3 text-left flex flex-col gap-3 items-start min-h-29"
      >
        <div className="w-full px-2 flex flex-col gap-2">
          <div className="pl-1 w-full flex items-center justify-between h-6">
            <span className="text-font-description-bold">{t('promo')}</span>
            <AnimatedMenuChevron ref={animatedChevronRef} />
          </div>
          <p className="pl-1 w-full text-font-description">{t('promoDescription')}</p>
        </div>
        <span className="w-full mt-auto bg-primary-low text-primary text-font-num-bold-10 text-center p-2">
          {t('upTo2435TkeyPerMonth')}
        </span>
      </Button>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-white border-0.5 border-lines rounded-8 overflow-clip py-3 flex flex-col gap-2 min-h-29">
        <div className="w-full pl-3 pr-2 flex items-center justify-between">
          <span className="text-font-description-bold">{t('promo')}</span>
          <PromoInfoIcon />
        </div>
        <div className="flex-1 flex justify-center items-center">
          <Loader size="L" trackVariant="dark" className="text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white border-0.5 border-lines rounded-8 overflow-clip py-3 flex flex-col min-h-29">
      <div className="w-full pl-3 pr-2 flex items-center justify-between">
        <span className="text-font-description-bold">{t('promo')}</span>
        <PromoInfoIcon />
      </div>
      <div className="w-full pl-3 pr-2 mt-auto">
        <AllTimeStats total={stats?.total} lastAmount={stats?.lastAmount} unit="TKEY" />
      </div>
    </div>
  );
};
