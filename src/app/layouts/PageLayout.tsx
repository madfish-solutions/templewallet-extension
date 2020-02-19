import * as React from "react";
import classNames from "clsx";
import { goBack } from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { useAppEnv } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import Identicon from "app/atoms/Identicon";
import styles from "./PageLayout.module.css";
// import SelectNetworkDropdown from "./PageLayout/SelectNetworkDropdown";
import { ReactComponent as ChevronLeftIcon } from "app/icons/chevron-left.svg";

type PageLayoutProps = HeaderProps;

const PageLayout: React.FC<PageLayoutProps> = ({ hasBackAction, children }) => (
  <div className="mb-12">
    <Header hasBackAction={hasBackAction} />
    <Content>{children}</Content>
  </div>
);

export default PageLayout;

type HeaderProps = {
  hasBackAction?: boolean;
};

const Header: React.FC<HeaderProps> = ({ hasBackAction }) => {
  const appEnv = useAppEnv();

  const { ready, account, lock } = useThanosFront();

  const handleBackAction = React.useCallback(() => {
    goBack();
  }, []);

  const handleLogoutClick = React.useCallback(() => {
    lock();
  }, [lock]);

  return (
    <header
      className={classNames(
        "bg-primary-orange",
        styles["inner-shadow"],
        appEnv.fullPage && "pb-24 -mb-20"
      )}
    >
      <ContentContainer className={classNames("py-4", "flex items-center")}>
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <img src="../misc/icon.png" alt="" width="36" height="36" />
          {appEnv.fullPage && (
            <span className="font-semibold ml-2 text-xl tracking-tight">
              Thanos
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* {ready && <SelectNetworkDropdown />} */}

        {ready && (
          <>
            {/* <span className="mr-2 text-base text-primary-white font-semibold text-shadow-black">
              Account 1
            </span> */}

            <div
              className={classNames(
                "bg-white-10",
                "border border-white-25",
                "rounded-md",
                "p-px",
                "transition ease-in-out duration-200",
                "shadow hover:shadow-md",
                "cursor-pointer"
              )}
            >
              <Identicon hash={account!.publicKeyHash} size={36} />
            </div>
          </>
        )}
      </ContentContainer>

      <ContentContainer
        className={classNames("flex items-center", !appEnv.fullPage && "pb-4")}
      >
        {hasBackAction && (
          <button
            className={classNames(
              "px-4 py-2",
              "bg-white-10 rounded",
              "flex items-center",
              "text-primary-orange-lighter text-shadow-black-orange",
              "text-sm font-semibold",
              "shadow hover:shadow-md",
              "transition duration-300 ease-in-out",
              "opacity-90 hover:opacity-100"
            )}
            onClick={handleBackAction}
          >
            <ChevronLeftIcon
              className={classNames(
                "-ml-2",
                "h-5 w-auto",
                "stroke-current",
                "stroke-2"
              )}
            />
            Back
          </button>
        )}

        <div className="flex-1" />

        {ready && (
          <button
            className={classNames(
              "px-4 py-2",
              "bg-white-10 rounded",
              "flex items-center",
              "text-primary-orange-lighter text-shadow-black-orange",
              "text-sm font-semibold",
              "shadow hover:shadow-md",
              "transition duration-300 ease-in-out",
              "opacity-90 hover:opacity-100"
            )}
            onClick={handleLogoutClick}
          >
            Log out
          </button>
        )}
      </ContentContainer>
    </header>
  );
};

const Content: React.FC = ({ children }) => {
  const appEnv = useAppEnv();

  return appEnv.fullPage ? (
    <ContentContainer>
      <div
        className={classNames("bg-white", "rounded-md shadow-lg", "px-4")}
        style={{ minHeight: "20rem" }}
      >
        {children}
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer className="bg-white">{children}</ContentContainer>
  );
};
