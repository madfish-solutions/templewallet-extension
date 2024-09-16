import React, { memo } from 'react';

import { useDispatch } from 'react-redux';

import { T } from 'lib/i18n';
import { setIsNewsEnabledAction } from 'lib/notifications/store/actions';
import { useIsNewsEnabledSelector } from 'lib/notifications/store/selectors';

import { SettingsGeneralSelectors } from '../selectors';

import { EnablingSetting } from './enabling-setting';

export const NotificationsSettings = memo(() => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();

  const handleNewsNotificationsChange = (checked: boolean) => dispatch(setIsNewsEnabledAction(checked));

  return (
    <EnablingSetting
      title={<T id="notifications" />}
      description={<T id="notificationsSettingsDescription" />}
      enabled={isNewsEnabled}
      onChange={handleNewsNotificationsChange}
      testID={SettingsGeneralSelectors.notificationCheckBox}
    />
  );
});
