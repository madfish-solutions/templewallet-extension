import * as React from "react";
import classNames from "clsx";
import Popper from "lib/ui/Popper";
import { Link } from "lib/woozie";
import { useThanosClient, useAccount } from "lib/thanos/front";
import { useAppEnv } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import Logo from "app/atoms/Logo";
import styles from "./Header.module.css";
import NetworkSelect from "./Header/NetworkSelect";
import AccountDropdown from "./Header/AccountDropdown";
import LanguageSelect from "./Header/LanguageSelect";

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
        <div className={classNames(appEnv.fullPage && "px-4")}>
          <div className="flex items-stretch">
            <Link to="/" className="flex-shrink-0 pr-4">
              <Logo hasTitle={appEnv.fullPage} />
            </Link>

            {ready && <Control />}
          </div>
        </div>
      </ContentContainer>
    </header>
  );
};

export default Header;

const Control: React.FC = () => {
  const account = useAccount();

  return (
    <>
      <div className={classNames("flex-1", "flex flex-col items-end")}>
        <div className="max-w-full overflow-x-hidden">
          <Name
            className={classNames(
              "text-primary-white",
              "text-sm font-semibold",
              "text-shadow-black",
              "opacity-90"
            )}
          >
            {account.name}
          </Name>
        </div>

        <div className="flex-1" />

        <div className="flex">
          <LanguageSelect />

          <NetworkSelect />
        </div>
      </div>

      <Popper
        placement="bottom-end"
        strategy="fixed"
        popup={(props) => <AccountDropdown {...props} />}
      >
        {({ ref, opened, toggleOpened }) => (
          <button
            ref={ref}
            className={classNames(
              "ml-2 flex-shrink-0 flex",
              "bg-white bg-opacity-10",
              "border border-white border-opacity-25",
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
            <Identicon type="bottts" hash={account.publicKeyHash} size={48} />
          </button>
        )}
      </Popper>
    </>
  );
};
