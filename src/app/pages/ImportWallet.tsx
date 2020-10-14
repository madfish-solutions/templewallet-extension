import * as React from "react";
import { useTranslation } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const ImportWallet: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PageLayout>
      <NewWallet ownMnemonic title={t("restoreWalletWithSeedPhrase")} />
    </PageLayout>
  );
};

export default ImportWallet;
