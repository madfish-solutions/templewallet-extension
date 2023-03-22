import React, { FC, useCallback, useRef, useState } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t } from 'lib/i18n';
import { isPopupModeEnabled, setPopupMode } from 'lib/popup-mode';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';
import { GeneralSettingLabel } from './GeneralSettingLabel';

const PopupSettings: FC<{}> = () => {
  const popupEnabled = isPopupModeEnabled();
  const changingRef = useRef(false);
  const [error, setError] = useState<any>(null);

  const handlePopupModeChange = useCallback(
    (checked: boolean) => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      setPopupMode(checked);
      changingRef.current = false;
      window.location.reload();
    },
    [setError]
  );

  return (
    <>
      <GeneralSettingLabel titleI18nKey="popupSettings" descriptionI18nKey="popupSettingsDescription" />

      <FormCheckbox
        checked={popupEnabled}
        onChange={handlePopupModeChange}
        name="popupEnabled"
        label={t(popupEnabled ? 'popupEnabled' : 'popupDisabled')}
        errorCaption={error?.message}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.popUpCheckBox}
      />
    </>
  );
};

export default PopupSettings;
