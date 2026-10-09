import React, { memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { setIsAccountNotificationsEnabledAction, setIsNewsEnabledAction } from 'app/store/notifications/actions';
import { useIsAccountNotificationsEnabledSelector, useIsNewsEnabledSelector } from 'app/store/notifications/selectors';
import { EnablingSetting } from 'app/templates/enabling-setting';
import { T } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../selectors';

export const NotificationsSettings = memo(() => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();
  const isAccountNotificationsEnabled = useIsAccountNotificationsEnabledSelector();

  const handleNewsNotificationsChange = useCallback(
    (checked: boolean) => dispatch(setIsNewsEnabledAction(checked)),
    [dispatch]
  );

  const handleAccountNotificationsChange = useCallback(
    (checked: boolean) => dispatch(setIsAccountNotificationsEnabledAction(checked)),
    [dispatch]
  );

  return (
    <>
      <EnablingSetting
        title={<T id="notifications" />}
        description={<T id="notificationsSettingsDescription" />}
        enabled={isNewsEnabled}
        onChange={handleNewsNotificationsChange}
        testID={SettingsGeneralSelectors.notificationCheckBox}
      />

      <EnablingSetting
        title={<T id="pushNotifications" />}
        description={<T id="pushNotificationsDescription" />}
        enabled={isAccountNotificationsEnabled}
        onChange={handleAccountNotificationsChange}
        testID={SettingsGeneralSelectors.pushNotificationCheckBox}
      />
    </>
  );
});
