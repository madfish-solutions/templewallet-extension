import React from "react";
import LocaleSelect from "app/templates/LocaleSelect";

const GeneralSettings: React.FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect />
    </div>
  );
};

export default GeneralSettings;
