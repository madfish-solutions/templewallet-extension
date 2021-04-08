import React from "react";

import { ReactComponent as SwapIcon } from "app/icons/swap.svg";
import PageLayout from "app/layouts/PageLayout";
import SwapForm from "app/templates/SwapForm";
import { t } from "lib/i18n/react";

const Swap: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <SwapIcon className="w-auto h-4 mr-1 stroke-current" /> {t("swap")}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SwapForm />
      </div>
    </div>
  </PageLayout>
);

export default Swap;
