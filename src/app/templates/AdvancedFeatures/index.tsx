import { FC, PropsWithChildren } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { IS_MISES_BROWSER } from 'lib/env';
import { TID, T } from 'lib/i18n';

import { DealsSettings } from './deals-settings';
import { PartnersPromotionSettings } from './partners-promotion-settings';
import { ReferralLinksSettings } from './referral-links-settings';
import { TokenInsightSettings } from './token-insight-settings';

export const AdvancedFeatures = () => (
  <FadeTransition>
    <div className="flex flex-col gap-4">
      <SettingsGroup title="templeRewards">
        <PartnersPromotionSettings />
        <DealsSettings />
      </SettingsGroup>

      <SettingsGroup title="webWidgets">
        <TokenInsightSettings />
      </SettingsGroup>

      {IS_MISES_BROWSER && <ReferralLinksSettings />}
    </div>
  </FadeTransition>
);

interface SettingsGroupProps extends PropsWithChildren {
  title: TID;
}

const SettingsGroup: FC<SettingsGroupProps> = ({ title, children }) => (
  <div className="flex flex-col">
    <div className="p-1 mb-1 text-font-description-bold">
      <T id={title} />
    </div>

    <div className="flex flex-col gap-4">{children}</div>
  </div>
);
