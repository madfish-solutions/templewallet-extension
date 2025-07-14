import React, { memo } from 'react';

import { usePartnersPromotionSettings } from 'app/hooks/use-partners-promotion-settings';
import { useReferralLinksSettings } from 'app/hooks/use-referral-links-settings';
import { IS_MISES_BROWSER } from 'lib/env';
import { t, T } from 'lib/i18n';

import { Section } from '../section';
import { RewardsPageSelectors } from '../selectors';

import { ReactComponent as AdsIcon } from './ads.svg';
import { FeatureItem } from './feature-item';
import { ReactComponent as ReferralsIcon } from './referrals.svg';

export const ActiveFeatures = memo(() => {
  const { isEnabled: adsEnabled, setEnabled: setAdsEnabled } = usePartnersPromotionSettings();
  const { isEnabled: referralEnabled, setEnabled: setReferralEnabled } = useReferralLinksSettings();

  return (
    <Section title={<T id="activeFeatures" />}>
      <FeatureItem
        Icon={AdsIcon}
        enabled={adsEnabled}
        setEnabled={setAdsEnabled}
        name={<T id="partnersPromoSettings" />}
        description={<T id="advertisingFeatureDescription" />}
        tooltip={t('advertisingFeatureTooltip')}
        buttonTestID={RewardsPageSelectors.disableAdsButton}
      />

      {IS_MISES_BROWSER && (
        <FeatureItem
          Icon={ReferralsIcon}
          enabled={referralEnabled}
          setEnabled={setReferralEnabled}
          name={<T id="referralLinks" />}
          description={<T id="referralLinksFeatureDescription" />}
          tooltip={t('referralLinksFeatureTooltip')}
          buttonTestID={RewardsPageSelectors.disableReferralLinksButton}
        />
      )}
    </Section>
  );
});
