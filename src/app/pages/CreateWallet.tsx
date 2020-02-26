import * as React from "react";
import PageLayout from "app/layouts/PageLayout";
import NewWallet from "app/templates/NewWallet";

const CreateWallet: React.FC = () => {
  return (
    <PageLayout>
      <NewWallet title="Create new Wallet" />
    </PageLayout>
  );
};

export default CreateWallet;
