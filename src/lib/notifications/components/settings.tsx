import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { EnablingSetting } from 'app/templates/EnablingSetting';
import { SettingsGeneralSelectors } from 'app/templates/SettingsGeneral/selectors';

import { setIsNewsEnabledAction } from '../store/actions';
import { useIsNewsEnabledSelector } from '../store/selectors';

export const NotificationsSettings: FC = () => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();

  const handleNewsNotificationsChange = (checked: boolean) => dispatch(setIsNewsEnabledAction(checked));

  return (
    <EnablingSetting
      titleI18nKey="notifications"
      descriptionI18nKey="notificationsSettingsDescription"
      enabled={isNewsEnabled}
      onChange={handleNewsNotificationsChange}
      testID={SettingsGeneralSelectors.notificationCheckBox}
    />
  );
};
