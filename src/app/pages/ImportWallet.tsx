import React, { FC } from "react";

import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";
import { t } from "lib/i18n/react";

const ImportWallet: FC = () => (
  <PageLayout>
    <NewWallet ownMnemonic title={t("restoreWalletWithSeedPhrase")} />
  </PageLayout>
);

export default ImportWallet;
