import { FC } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { TID, T } from 'lib/i18n';

import { DealsSettings } from './deals-settings';
import { PartnersPromotionSettings } from './partners-promotion-settings';

export const AdvancedFeatures = () => (
  <FadeTransition>
    <div className="flex flex-col gap-4">
      <SettingsGroup title="templeRewards">
        <PartnersPromotionSettings />
        <DealsSettings />
      </SettingsGroup>
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
