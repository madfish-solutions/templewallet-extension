import * as React from "react";
import { t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const CreateWallet: React.FC = () => (
  <PageLayout>
    <NewWallet title={t("createNewWallet")} />
  </PageLayout>
);

export default CreateWallet;
