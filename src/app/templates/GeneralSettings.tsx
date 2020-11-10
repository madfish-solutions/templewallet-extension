import React from "react";
import LocaleSelect from "app/templates/LocaleSelect";
import PopupSettings from "app/templates/PopupSettings";

const GeneralSettings: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect className="mb-8" />

      <PopupSettings />
    </div>
  );
};

export default GeneralSettings;
