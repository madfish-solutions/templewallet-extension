import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { ThanosAccountType, useAccount } from "lib/thanos/front";
import { T, t } from "lib/i18n/react";
import ErrorBoundary from "app/ErrorBoundary";
import PageLayout from "app/layouts/PageLayout";
import OperationHistory from "app/templates/OperationHistory";
import Spinner from "app/atoms/Spinner";
import SubTitle from "app/atoms/SubTitle";
import { ReactComponent as ExploreIcon } from "app/icons/explore.svg";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as SendIcon } from "app/icons/send.svg";
import EditableTitle from "./Explore/EditableTitle";
import AddressChip from "./Explore/AddressChip";
import Assets from "./Explore/Assets";
import BakingSection from "./Explore/BakingSection";

const Explore: React.FC = () => {
  const account = useAccount();
  const accountPkh = account.publicKeyHash;

  return (
    <PageLayout
      pageTitle={
        <T id="explore">
          {(message) => (
            <>
              <ExploreIcon className="w-auto h-4 mr-1 stroke-current" />
              {message}
            </>
          )}
        </T>
      }
    >
      <EditableTitle />

      <hr className="mb-4" />

      <div className="flex flex-col items-center">
        <AddressChip pkh={accountPkh} className="mb-6" />

        <div style={{ minHeight: "12rem" }}>
          <SuspenseContainer
            whileMessage={t("assetsWhileMessage")}
            fallback={null}
          >
            <Assets accountPkh={accountPkh} />
          </SuspenseContainer>
        </div>

        <div
          className="flex items-stretch w-full mx-auto mt-4"
          style={{ maxWidth: "18rem" }}
        >
          <div className="w-1/2 p-2">
            <Link
              to="/receive"
              className={classNames(
                "block w-full",
                "py-2 px-4 rounded",
                "border-2",
                "border-blue-500 hover:border-blue-600 focus:border-blue-600",
                "flex items-center justify-center",
                "text-blue-500 hover:text-blue-600 focus:text-blue-600",
                "shadow-sm hover:shadow focus:shadow",
                "text-base font-semibold",
                "transition ease-in-out duration-300"
              )}
              type="button"
            >
              <QRIcon
                className={classNames(
                  "-ml-2 mr-2",
                  "h-5 w-auto",
                  "stroke-current"
                )}
              />
              <T id="receive" />
            </Link>
          </div>

          <div className="w-1/2 p-2">
            <Link
              to="/send"
              className={classNames(
                "w-full",
                "py-2 px-4 rounded",
                "border-2",
                "border-blue-500 hover:border-blue-600 focus:border-blue-600",
                "bg-blue-500 hover:bg-blue-600",
                "shadow-sm hover:shadow focus:shadow",
                "flex items-center justify-center",
                "text-white",
                "text-base font-semibold",
                "transition ease-in-out duration-300"
              )}
              type="button"
            >
              <SendIcon
                className={classNames(
                  "-ml-3 -mt-1 mr-1",
                  "h-5 w-auto",
                  "transform -rotate-45",
                  "stroke-current"
                )}
              />
              <T id="send" />
            </Link>
          </div>
        </div>
      </div>

      <T id="baking">{(message) => <SubTitle>{message}</SubTitle>}</T>

      <SuspenseContainer whileMessage={t("delegationInfoWhileMessage")}>
        <BakingSection />
      </SuspenseContainer>

      <T id="operations">{(message) => <SubTitle>{message}</SubTitle>}</T>

      <SuspenseContainer whileMessage={t("operationHistoryWhileMessage")}>
        <OperationHistory
          accountPkh={accountPkh}
          accountOwner={
            account.type === ThanosAccountType.ManagedKT
              ? account.owner
              : undefined
          }
        />
      </SuspenseContainer>
    </PageLayout>
  );
};

export default Explore;

type SuspenseContainerProps = {
  whileMessage: string;
  fallback?: React.ReactNode;
};

const SuspenseContainer: React.FC<SuspenseContainerProps> = ({
  whileMessage,
  fallback = <SpinnerSection />,
  children,
}) => (
  <ErrorBoundary whileMessage={whileMessage}>
    <React.Suspense fallback={fallback}>{children}</React.Suspense>
  </ErrorBoundary>
);

const SpinnerSection: React.FC = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
