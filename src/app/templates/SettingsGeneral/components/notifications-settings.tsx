import React, { memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { EnablingSetting } from 'app/templates/enabling-setting';
import { T } from 'lib/i18n';
import { setIsNewsEnabledAction } from 'lib/notifications/store/actions';
import { useIsNewsEnabledSelector } from 'lib/notifications/store/selectors';

import { SettingsGeneralSelectors } from '../selectors';

export const NotificationsSettings = memo(() => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();

  const handleNewsNotificationsChange = useCallback(
    (checked: boolean) => dispatch(setIsNewsEnabledAction(checked)),
    [dispatch]
  );

  return (
    <EnablingSetting
      titleI18nKey="notifications"
      description={<T id="notificationsSettingsDescription" />}
      enabled={isNewsEnabled}
      onChange={handleNewsNotificationsChange}
      testID={SettingsGeneralSelectors.notificationCheckBox}
    />
  );
});
