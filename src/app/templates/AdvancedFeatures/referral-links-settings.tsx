import React, { memo } from 'react';

import { useReferralLinksSettings } from 'app/hooks/use-referral-links-settings';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const ReferralLinksSettings = memo(() => {
  const { isEnabled, setEnabled } = useReferralLinksSettings();

  return (
    <EnablingSetting
      title={<T id="referralLinks" />}
      description={<T id="referralLinksDescription" />}
      enabled={isEnabled}
      onChange={setEnabled}
      testID={AdvancedFeaturesSelectors.referralLinksCheckbox}
    />
  );
});
