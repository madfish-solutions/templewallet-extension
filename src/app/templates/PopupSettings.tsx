import React from "react";
import { isPopupModeEnabled, setPopupMode } from "lib/popup-mode";
import { t } from "lib/i18n/react";
import FormCheckbox from "app/atoms/FormCheckbox";

const PopupSettings: React.FC<{}> = () => {
  const popupEnabled = isPopupModeEnabled();
  const changingRef = React.useRef(false);
  const [error, setError] = React.useState<any>(null);

  const handlePopupModeChange = React.useCallback(
    (evt) => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      setPopupMode(evt.target.checked);
      changingRef.current = false;
      window.location.reload();
    },
    [setError]
  );

  return (
    <FormCheckbox
      checked={popupEnabled}
      onChange={handlePopupModeChange}
      name="popupEnabled"
      label={t(popupEnabled ? "popupEnabled" : "popupDisabled")}
      labelDescription={t("enablePopup")}
      errorCaption={error?.message}
      containerClassName="mb-4"
    />
  );
};

export default PopupSettings;
