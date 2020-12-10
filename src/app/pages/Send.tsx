import * as React from "react";
import { t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import SendForm from "app/templates/SendForm";
import { ReactComponent as SendIcon } from "app/icons/send.svg";

type SendProps = {
  assetSlug?: string | null;
};

const Send: React.FC<SendProps> = ({ assetSlug }) => (
  <PageLayout
    pageTitle={
      <>
        <SendIcon className="w-auto h-4 mr-1 stroke-current" /> {t("send")}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SendForm assetSlug={assetSlug} />
      </div>
    </div>
  </PageLayout>
);

export default Send;
