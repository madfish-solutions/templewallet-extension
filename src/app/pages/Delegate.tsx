import React, { FC } from "react";

import { ReactComponent as DiamondIcon } from "app/icons/diamond.svg";
import PageLayout from "app/layouts/PageLayout";
import DelegateForm from "app/templates/DelegateForm";
import { T } from "lib/i18n/react";

const Delegate: FC = () => (
  <PageLayout
    pageTitle={
      <T id="delegate">
        {(message) => (
          <>
            <DiamondIcon className="mr-1 h-4 w-auto stroke-current" /> {message}
          </>
        )}
      </T>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <DelegateForm />
      </div>
    </div>
  </PageLayout>
);

export default Delegate;
