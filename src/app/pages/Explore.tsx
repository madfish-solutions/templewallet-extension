import * as React from "react";
import classNames from "clsx";
import { useThanosFront } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";

const Explore: React.FC = () => {
  const { account } = useThanosFront();

  return (
    <PageLayout hasBackAction>
      <div className="py-4">
        <h1
          className={classNames(
            "mb-2",
            "text-2xl font-light text-gray-700 text-center"
          )}
        >
          Explore Wallet
        </h1>

        <hr className="my-4" />

        <p className="font-base text-gray-600">
          Hello, {account!.publicKeyHash}
        </p>
      </div>
    </PageLayout>
  );
};

export default Explore;
