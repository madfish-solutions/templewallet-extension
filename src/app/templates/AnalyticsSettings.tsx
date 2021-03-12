import React from "react";
import { t, T } from "lib/i18n/react";
import { useAnalytics } from "lib/analytics";
import FormCheckbox from "app/atoms/FormCheckbox";

const AnalyticsSettings: React.FC<{}> = () => {
  const { analyticsEnabled, setAnalyticsEnabled } = useAnalytics();

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAnalyticsEnabled(evt.target.checked);
  }

  return (
    <>
      <label
        className="mb-4 leading-tight flex flex-col"
        htmlFor="analyticsSettings"
      >
        <span className="text-base font-semibold text-gray-700">
          <T id="analyticsSettings" />
        </span>

        <span
          className="mt-1 text-xs font-light text-gray-600"
          style={{ maxWidth: "90%" }}
        >
          <T id="analyticsSettingsDescription" />
        </span>
      </label>

      <FormCheckbox
        checked={analyticsEnabled}
        onChange={handlePopupModeChange}
        name="analyticsEnabled"
        label={t(analyticsEnabled ? "analyticsEnabled" : "analyticsDisabled")}
        containerClassName="mb-4"
      />
    </>
  );
};

export default AnalyticsSettings;
