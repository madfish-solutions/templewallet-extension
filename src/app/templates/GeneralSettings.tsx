import React from "react";
import { browser } from "webextension-polyfill-ts";
import { isPopupModeEnabled, setPopupMode } from "lib/popup-mode";
import { t } from "lib/i18n/react";
import LocaleSelect from "app/templates/LocaleSelect";
import FormCheckbox from "app/atoms/FormCheckbox";

const GeneralSettings: React.FC = () => {
  const popupEnabled = isPopupModeEnabled();

  const changingRef = React.useRef(false);
  const [error, setError] = React.useState<any>(null);

  const handlePopupModeChange = React.useCallback(
    async (evt) => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      try {
        setPopupMode(evt.target.checked);
        await refresh();
      } catch (err) {
        setError(err);
      }

      changingRef.current = false;
    },
    [setError]
  );

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <FormCheckbox
        checked={popupEnabled}
        onChange={handlePopupModeChange}
        name="popupEnabled"
        label={t(popupEnabled ? "popupEnabled" : "popupDisabled")}
        labelDescription={t("enablePopup")}
        errorCaption={error?.message}
        containerClassName="mb-4"
      />

      <LocaleSelect />
    </div>
  );
};

export default GeneralSettings;

async function refresh() {
  if (!(await isBackgroundScript())) {
    window.location.reload();
  }
}

async function isBackgroundScript() {
  let backgroundWindow;
  try {
    backgroundWindow = await browser.runtime.getBackgroundPage();
  } catch {}
  return window === backgroundWindow;
}
