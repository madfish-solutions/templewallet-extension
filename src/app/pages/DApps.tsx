import React, { FC } from "react";

import { ReactComponent as DAppsIcon } from "app/icons/apps-alt.svg";
import PageLayout from "app/layouts/PageLayout";
import DAppsList from "app/templates/DAppsList";
import { t } from "lib/i18n/react";

const DApps: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <DAppsIcon className="w-auto h-4 mr-1 stroke-current" /> {t("dApps")}
      </>
    }
  >
    <DAppsList />
  </PageLayout>
);

export default DApps;
