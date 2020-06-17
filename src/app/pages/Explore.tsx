import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useAccount } from "lib/thanos/front";
import ErrorBoundary from "app/ErrorBoundary";
import PageLayout from "app/layouts/PageLayout";
import OperationHistory from "app/templates/OperationHistory";
import HashChip from "app/atoms/HashChip";
import Spinner from "app/atoms/Spinner";
import SubTitle from "app/atoms/SubTitle";
import { ReactComponent as ExploreIcon } from "app/icons/explore.svg";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as SendIcon } from "app/icons/send.svg";
import EditableTitle from "./Explore/EditableTitle";
import Assets from "./Explore/Assets";
import BakingSection from "./Explore/BakingSection";

const Explore: React.FC = () => {
  const account = useAccount();
  const accountPkh = account.publicKeyHash;

  return (
    <PageLayout
      pageTitle={
        <>
          <ExploreIcon className="mr-1 h-4 w-auto stroke-current" />
          Explore
        </>
      }
    >
      <EditableTitle />

      <hr className="mb-4" />

      <div className="flex flex-col items-center">
        <HashChip hash={accountPkh} className="mb-6" />

        <Assets accountPkh={accountPkh} />

        <div
          className="mt-4 w-full mx-auto flex items-stretch"
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
              Receive
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
              Send
            </Link>
          </div>
        </div>
      </div>

      <SubTitle>Baking</SubTitle>

      <SuspenseContainer whileMessage="fetching or processing your delegation info">
        <BakingSection />
      </SuspenseContainer>

      <SubTitle>Operations</SubTitle>

      <SuspenseContainer whileMessage="fetching or processing operation history from TZStats">
        <OperationHistory accountPkh={accountPkh} />
      </SuspenseContainer>
    </PageLayout>
  );
};

export default Explore;

const SuspenseContainer: React.FC<{ whileMessage: string }> = ({
  whileMessage,
  children,
}) => (
  <ErrorBoundary whileMessage={whileMessage}>
    <React.Suspense fallback={<SpinnerSection />}>{children}</React.Suspense>
  </ErrorBoundary>
);

const SpinnerSection: React.FC = () => (
  <div className="my-12 flex justify-center">
    <Spinner theme="gray" className="w-20" />
  </div>
);
