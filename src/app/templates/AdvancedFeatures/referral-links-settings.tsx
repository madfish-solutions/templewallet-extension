import React, { memo } from 'react';

import { useReferralLinksSettings } from 'app/hooks/use-referral-links-settings';

import { EnablingSetting } from '../EnablingSetting';

import { AdvancedFeaturesSelectors } from './selectors';

export const ReferralLinksSettings = memo(() => {
  const { isEnabled, setEnabled } = useReferralLinksSettings();

  return (
    <EnablingSetting
      titleI18nKey="referralLinks"
      descriptionI18nKey="referralLinksDescription"
      enabled={isEnabled}
      onChange={setEnabled}
      testID={AdvancedFeaturesSelectors.referralLinksCheckbox}
    />
  );
});
