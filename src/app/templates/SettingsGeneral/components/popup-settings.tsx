import React, { memo, useCallback, useRef } from 'react';

import { T } from 'lib/i18n';
import { isPopupModeEnabled, setPopupMode } from 'lib/popup-mode';

import { EnablingSetting } from '../../enabling-setting';
import { SettingsGeneralSelectors } from '../selectors';

export const PopupSettings = memo(() => {
  const popupEnabled = isPopupModeEnabled();
  const changingRef = useRef(false);

  const handlePopupModeChange = useCallback((checked: boolean) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setPopupMode(checked);
    changingRef.current = false;
    window.location.reload();
  }, []);

  return (
    <EnablingSetting
      title={<T id="popupSettings" />}
      description={<T id="popupSettingsDescription" />}
      enabled={popupEnabled}
      onChange={handlePopupModeChange}
      testID={SettingsGeneralSelectors.popUpCheckBox}
    />
  );
});
