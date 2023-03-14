import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { FormCheckbox } from 'app/atoms';
import { T, t } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../../../app/templates/SettingsGeneral/SettingsGeneral.selectors';
import { setIsNewsEnabledAction } from '../store/actions';
import { useIsNewsEnabledSelector } from '../store/selectors';

export const NotificationsSettings: FC = () => {
  const dispatch = useDispatch();
  const isNewsEnabled = useIsNewsEnabledSelector();

  const handleNewsNotificationsChange = (checked: boolean) => dispatch(setIsNewsEnabledAction(checked));

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="notifications" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="notificationsSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        name="newsNotificationsEnabled"
        label={t('news')}
        containerClassName="mb-4"
        checked={isNewsEnabled}
        onChange={handleNewsNotificationsChange}
        testID={SettingsGeneralSelectors.notificationCheckBox}
      />
    </>
  );
};
