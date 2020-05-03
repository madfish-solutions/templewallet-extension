import * as React from "react";
import PageLayout from "app/layouts/PageLayout";
import DelegateForm from "app/templates/DelegateForm";
import { ReactComponent as DiamondIcon } from "app/icons/diamond.svg";

const Delegate: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <DiamondIcon className="mr-1 h-4 w-auto stroke-current" /> Delegate
      </>
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
