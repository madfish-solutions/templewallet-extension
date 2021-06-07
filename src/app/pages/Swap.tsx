import React from "react";

import { ReactComponent as SwapIcon } from "app/icons/swap.svg";
import PageLayout from "app/layouts/PageLayout";
import SwapForm from "app/templates/SwapForm";
import { t } from "lib/i18n/react";

type SwapProps = {
  assetSlug?: string | null;
};

const Swap: React.FC<SwapProps> = ({ assetSlug }) => (
  <PageLayout
    pageTitle={
      <>
        <SwapIcon className="w-auto h-4 mr-1 stroke-current" /> {t("swap")}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SwapForm assetSlug={assetSlug} />
      </div>
    </div>
  </PageLayout>
);

export default Swap;
