import * as React from "react";
import { useTranslation } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const CreateWallet: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <NewWallet title={t("createNewWallet")} />
    </PageLayout>
  );
};

export default CreateWallet;
