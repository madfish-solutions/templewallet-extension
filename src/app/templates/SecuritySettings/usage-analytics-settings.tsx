import React, { memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { setIsAnalyticsEnabledAction } from 'app/store/settings/actions';
import { useAnalyticsEnabledSelector } from 'app/store/settings/selectors';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { SecuritySettingsSelectors } from './selectors';

export const UsageAnalyticsSettings = memo(() => {
  const dispatch = useDispatch();
  const enabled = useAnalyticsEnabledSelector();

  const handleSwitch = useCallback((newValue: boolean) => dispatch(setIsAnalyticsEnabledAction(newValue)), [dispatch]);

  return (
    <EnablingSetting
      disabled
      title={<T id="usageAnalytics" />}
      enabled={enabled}
      description={<T id="usageAnalyticsSettingsDescription" />}
      onChange={handleSwitch}
      testID={SecuritySettingsSelectors.usageAnalyticsToggle}
    />
  );
});
