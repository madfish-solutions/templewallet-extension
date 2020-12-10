import React from "react";
import { isPopupModeEnabled, setPopupMode } from "lib/popup-mode";
import { t, T } from "lib/i18n/react";
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
    <>
      <label
        className="mb-4 leading-tight flex flex-col"
        htmlFor="popupEnabled"
      >
        <span className="text-base font-semibold text-gray-700">
          <T id="popupSettings" />
        </span>

        <span
          className="mt-1 text-xs font-light text-gray-600"
          style={{ maxWidth: "90%" }}
        >
          <T id="popupSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={popupEnabled}
        onChange={handlePopupModeChange}
        name="popupEnabled"
        label={t(popupEnabled ? "popupEnabled" : "popupDisabled")}
        // labelDescription={t("enablePopup")}
        errorCaption={error?.message}
        containerClassName="mb-4"
      />
    </>
  );
};

export default PopupSettings;
