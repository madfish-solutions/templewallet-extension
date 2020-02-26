import * as React from "react";
import classNames from "clsx";
import { useThanosFront } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import Identicon from "app/atoms/Identicon";
import ExploreAccount from "app/templates/ExploreAccount";

const Explore: React.FC = () => {
  const { account } = useThanosFront();

  if (!account) {
    throw new Error("Explore page only allowed with existing Account");
  }

  return (
    <PageLayout>
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
          Hello, {account.publicKeyHash}
        </p>

        <div className="my-4">
          <Identicon hash={account.publicKeyHash} size={56} />
        </div>
        <div className="my-4">
          <ExploreAccount />
        </div>
      </div>
    </PageLayout>
  );
};

export default Explore;
