import React, { FC } from "react";

import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";
import { t } from "lib/i18n/react";

const CreateWallet: FC = () => (
  <PageLayout>
    <NewWallet title={t("createNewWallet")} />
  </PageLayout>
);

export default CreateWallet;
