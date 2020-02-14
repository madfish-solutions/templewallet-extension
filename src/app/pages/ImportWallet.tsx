import * as React from "react";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const ImportWallet: React.FC = () => {
  return (
    <PageLayout hasBackAction>
      <NewWallet ownMnemonic title="Restore your Account with Seed Phrase" />
    </PageLayout>
  );
};

export default ImportWallet;
