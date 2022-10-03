import React, { FC } from 'react';

import { FormCheckbox } from 'app/atoms/FormCheckbox';
import { T, t } from 'lib/i18n/react';
import { useLocalStorage } from 'lib/temple/front';
import { TempleNotificationsSharedStorageKey } from 'lib/temple/types';

const NotificationsSettings: FC = () => {
  const [newsNotificationsEnabled, setNewsNotificationsEnabled] = useLocalStorage<boolean>(
    TempleNotificationsSharedStorageKey.NewsNotificationsEnabled,
    true
  );

  const handleNewsNotificationsChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setNewsNotificationsEnabled(evt.target.checked);
  };

  return (
    <>
      <label className="mb-4 leading-tight flex flex-col" htmlFor="notifications">
        <span className="text-base font-semibold text-gray-700">
          <T id="notifications" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="notificationsSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={newsNotificationsEnabled}
        onChange={handleNewsNotificationsChange}
        name="newsNotificationsEnabled"
        label={t('news')}
        containerClassName="mb-4"
      />
    </>
  );
};

export default NotificationsSettings;
