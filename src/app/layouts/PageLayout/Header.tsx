import * as React from "react";
import classNames from "clsx";
import Popper from "lib/ui/Popper";
import { Link } from "lib/woozie";
import { useThanosClient, useReadyThanos } from "lib/thanos/front";
import { useAppEnv } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import Identicon from "app/atoms/Identicon";
import styles from "./Header.module.css";
import NetworkSelect from "./Header/NetworkSelect";
import AccountDropdown from "./Header/AccountDropdown";

const Header: React.FC = () => {
  const appEnv = useAppEnv();
  const { ready } = useThanosClient();

  return (
    <header
      className={classNames(
        "bg-primary-orange",
        styles["inner-shadow"],
        appEnv.fullPage && "pb-20 -mb-20"
      )}
    >
      <ContentContainer className="py-4">
        <div
          className={classNames("flex items-strech", appEnv.fullPage && "px-4")}
        >
          <Link
            to="/"
            className="block flex items-center flex-shrink-0 text-white mr-2"
          >
            <img
              src="../misc/icon.png"
              alt=""
              width="40"
              height="40"
              style={{
                marginTop: 6,
                marginBottom: 6
              }}
            />

            {appEnv.fullPage && (
              <span className="font-semibold ml-1 text-xl tracking-tight">
                Thanos
              </span>
            )}
          </Link>

          <div className="flex-1" />

          {ready && <Control />}
        </div>
      </ContentContainer>
    </header>
  );
};

export default Header;

const Control: React.FC = () => {
  const { account } = useReadyThanos();

  return (
    <>
      <div className={classNames("mr-2", "flex flex-col items-end")}>
        <div
          className={classNames(
            "overflow-hidden",
            "ml-2",
            "text-primary-white",
            "text-sm font-semibold",
            "text-shadow-black",
            "opacity-90"
          )}
        >
          {account.name}
        </div>

        <div className="flex-1" />

        <NetworkSelect />
      </div>

      <Popper
        placement="bottom-end"
        strategy="fixed"
        popup={props => <AccountDropdown {...props} />}
      >
        {({ ref, opened, toggleOpened }) => (
          <button
            ref={ref}
            className={classNames(
              "bg-white-10",
              "border border-white-25",
              "rounded-md",
              "p-px",
              "transition ease-in-out duration-200",
              opened ? "shadow-md" : "shadow hover:shadow-md focus:shadow-md",
              opened
                ? "opacity-100"
                : "opacity-90 hover:opacity-100 focus:opacity-100",
              "cursor-pointer"
            )}
            onClick={toggleOpened}
          >
            <Identicon hash={account.publicKeyHash} size={48} />
          </button>
        )}
      </Popper>
    </>
  );
};
