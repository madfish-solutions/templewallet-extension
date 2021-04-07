import React, { FC } from "react";

import BlockExplorerSelect from "app/templates/BlockExplorerSelect";
import LocaleSelect from "app/templates/LocaleSelect";
import PopupSettings from "app/templates/PopupSettings";

import AnalyticsSettings from "./AnalyticsSettings";

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect className="mb-8" />

      <BlockExplorerSelect className="mb-8" />

      <PopupSettings />

      <AnalyticsSettings />
    </div>
  );
};

export default GeneralSettings;
