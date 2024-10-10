import React, { FC, useCallback, useRef, useState } from 'react';

import { EnablingSetting } from 'app/templates/EnablingSetting';
import { isPopupModeEnabled, setPopupMode } from 'lib/popup-mode';

import { SettingsGeneralSelectors } from '../selectors';

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
    <EnablingSetting
      titleI18nKey="popupSettings"
      descriptionI18nKey="popupSettingsDescription"
      enabled={popupEnabled}
      onChange={handlePopupModeChange}
      errorCaption={error?.message}
      testID={SettingsGeneralSelectors.popUpCheckBox}
    />
  );
};

export default PopupSettings;
