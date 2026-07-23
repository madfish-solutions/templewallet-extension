import React, { FC } from 'react';

import { useWebWidgetsSettings } from 'app/hooks/use-web-widgets-settings';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const TokenInsightSettings: FC = () => {
  const { isEnabled, setEnabled } = useWebWidgetsSettings();

  return (
    <EnablingSetting
      title={<T id="tokenInsight" />}
      description={<T id="tokenInsightDescription" />}
      enabled={isEnabled}
      onChange={setEnabled}
      testID={AdvancedFeaturesSelectors.tokenInsightCheckbox}
    />
  );
};
