import * as React from "react";
import { t } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const ImportWallet: React.FC = () => {
  return (
    <PageLayout>
      <NewWallet ownMnemonic title={t("restoreWalletWithSeedPhrase")} />
    </PageLayout>
  );
};

export default ImportWallet;
