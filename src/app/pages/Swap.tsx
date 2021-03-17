import * as React from "react";
import { t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import SwapForm from "app/templates/SwapForm";
import { ReactComponent as SwapIcon } from "app/icons/swap.svg";

const Send: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <SwapIcon className="w-auto h-4 mr-1 stroke-current" /> {t("swapNoun")}
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

export default Send;
