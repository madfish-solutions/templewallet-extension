import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { FormCheckbox } from 'app/atoms';
import { GeneralSettingLabel } from 'app/templates/SettingsGeneral/Components/GeneralSettingLabel';
import { SettingsGeneralSelectors } from 'app/templates/SettingsGeneral/SettingsGeneral.selectors';
import { t } from 'lib/i18n';

import { setIsNewsEnabledAction } from '../store/actions';
import { useIsNewsEnabledSelector } from '../store/selectors';

export const NotificationsSettings: FC = () => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();

  const handleNewsNotificationsChange = (checked: boolean) => dispatch(setIsNewsEnabledAction(checked));

  return (
    <>
      <GeneralSettingLabel titleI18nKey="notifications" descriptionI18nKey="notificationsSettingsDescription" />

      <FormCheckbox
        checked={isNewsEnabled}
        onChange={handleNewsNotificationsChange}
        label={t(isNewsEnabled ? 'enabled' : 'disabled')}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.notificationCheckBox}
      />
    </>
  );
};
