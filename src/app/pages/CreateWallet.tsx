import * as React from "react";
import { t } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const CreateWallet: React.FC = () => {
  return (
    <PageLayout>
      <NewWallet title={t("createNewWallet")} />
    </PageLayout>
  );
};

export default CreateWallet;
