import { isDefined } from '@rnw-community/shared';

import { Money } from 'app/atoms';
import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { useReferralLinksSettings } from 'app/hooks/use-referral-links-settings';
import { useTkeyRewardsStats } from 'app/hooks/use-rewards-stats';
import { browser } from 'lib/browser';
import { IS_MISES_BROWSER } from 'lib/env';
import { T } from 'lib/i18n';

import { StatsCard } from './stats-card';
import { StatsLoadingCard } from './stats-loading-card';

export const RewardsCard = () => {
  const { isEnabled: isAdvertisingEnabled } = usePartnersPromotionSettings();
  const { isEnabled: isReferralLinksEnabled } = useReferralLinksSettings();
  const { isLoading: isTkeyLoading, stats: tkeyStats } = useTkeyRewardsStats();

  const referralsEnabled = isReferralLinksEnabled && IS_MISES_BROWSER;

  if (isTkeyLoading || !tkeyStats) {
    return <StatsLoadingCard linkTo="/rewards" />;
  }

  const { total, lastAmount } = tkeyStats;

  return (
    <StatsCard
      linkTo="/rewards"
      title={<T id="rewards" />}
      value={
        <div className="flex items-center gap-1">
          <img src={browser.runtime.getURL('misc/token-logos/tkey.png')} alt="TKEY" className="h-4 w-auto" />
          <Money smallFractionFont={false}>{total}</Money>
        </div>
      }
      change={
        (!isAdvertisingEnabled && !referralsEnabled) || !isDefined(lastAmount) ? undefined : (
          <>
            +
            <Money cryptoDecimals={2} smallFractionFont={false}>
              {lastAmount}
            </Money>
          </>
        )
      }
      caption={isAdvertisingEnabled || referralsEnabled ? undefined : <T id="missingPayoutsCaption" />}
    />
  );
};
