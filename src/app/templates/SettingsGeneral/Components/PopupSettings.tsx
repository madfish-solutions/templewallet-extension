import React, { FC, useCallback, useRef, useState } from 'react';

import { FormCheckbox } from 'app/atoms';
import { t, T } from 'lib/i18n';
import { isPopupModeEnabled, setPopupMode } from 'lib/popup-mode';

import { SettingsGeneralSelectors } from '../SettingsGeneral.selectors';

const PopupSettings: FC<{}> = () => {
  const enabled = isPopupModeEnabled();
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
      <label className="mb-4 leading-tight flex flex-col" htmlFor="popupEnabled">
        <span className="text-base font-semibold text-gray-700">
          <T id="popupSettings" />
        </span>

        <span className="mt-1 text-xs font-light text-gray-600" style={{ maxWidth: '90%' }}>
          <T id="popupSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={enabled}
        onChange={handlePopupModeChange}
        name="popupEnabled"
        label={t(enabled ? 'popupEnabled' : 'popupDisabled')}
        // labelDescription={t("enablePopup")}
        errorCaption={error?.message}
        containerClassName="mb-4"
        testID={SettingsGeneralSelectors.popUpCheckBox}
        testIDProperties={{ enabled }}
      />
    </>
  );
};

export default PopupSettings;
