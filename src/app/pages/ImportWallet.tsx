import * as React from "react";
import { t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const ImportWallet: React.FC = () => (
  <PageLayout>
    <NewWallet ownMnemonic title={t("restoreWalletWithSeedPhrase")} />
  </PageLayout>
);

export default ImportWallet;
