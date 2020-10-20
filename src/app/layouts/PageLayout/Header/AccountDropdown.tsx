import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import {
  useThanosClient,
  useRelevantAccounts,
  useAccount,
  useSetAccountPkh,
} from "lib/thanos/front";
import { PopperRenderProps } from "lib/ui/Popper";
import { t } from "lib/i18n";
import { useAppEnv, openInFullPage } from "app/env";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import AccountTypeBadge from "app/atoms/AccountTypeBadge";
import Money from "app/atoms/Money";
import Balance from "app/templates/Balance";
import { ReactComponent as PeopleIcon } from "app/icons/people.svg";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as LinkIcon } from "app/icons/link.svg";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import { ReactComponent as MaximiseIcon } from "app/icons/maximise.svg";

type ExcludesFalse = <T>(x: T | false) => x is T;
type AccountDropdownProps = PopperRenderProps;

const AccountDropdown: React.FC<AccountDropdownProps> = ({
  opened,
  setOpened,
}) => {
  const appEnv = useAppEnv();
  const { lock } = useThanosClient();
  const allAccounts = useRelevantAccounts();
  const account = useAccount();
  const setAccountPkh = useSetAccountPkh();

  const closeDropdown = React.useCallback(() => {
    setOpened(false);
  }, [setOpened]);

  const handleLogoutClick = React.useCallback(() => {
    lock();
  }, [lock]);

  const handleMaximiseViewClick = React.useCallback(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    } else {
      closeDropdown();
    }
  }, [appEnv.popup, closeDropdown]);

  const actions = React.useMemo(
    () =>
      [
        {
          key: "create-account",
          Icon: AddIcon,
          content: t("createAccount"),
          linkTo: "/create-account",
          onClick: closeDropdown,
        },
        {
          key: "import-account",
          Icon: DownloadIcon,
          content: t("importAccount"),
          linkTo: "/import-account",
          onClick: closeDropdown,
        },
        {
          key: "connect-ledger",
          Icon: LinkIcon,
          content: "Connect Ledger",
          linkTo: "/connect-ledger",
          onClick: closeDropdown,
        },
        {
          key: "settings",
          Icon: SettingsIcon,
          content: t("settings"),
          linkTo: "/settings",
          onClick: closeDropdown,
        },
        {
          key: "maximise",
          Icon: MaximiseIcon,
          content: t(appEnv.fullPage ? "openNewTab" : "maximiseView"),
          linkTo: null,
          onClick: handleMaximiseViewClick,
        },
      ].filter((Boolean as any) as ExcludesFalse),
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick]
  );

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right"
      style={{
        minWidth: "16rem",
      }}
    >
      <div className="flex items-end mb-2">
        <h3
          className={classNames(
            "mx-1",
            "flex items-center",
            "text-sm text-white text-opacity-90"
          )}
        >
          Accounts
          <PeopleIcon className="w-auto h-6 ml-1 stroke-current" />
        </h3>

        <div className="flex-1" />

        <button
          className={classNames(
            "px-4 py-1",
            "rounded",
            "border border-white",
            "flex items-center",
            "text-white text-shadow-black",
            "text-sm",
            "hover:bg-white hover:bg-opacity-5",
            "transition duration-300 ease-in-out",
            "opacity-90 hover:opacity-100"
          )}
          onClick={handleLogoutClick}
        >
          Log out
        </button>
      </div>

      <div
        className={classNames(
          "overflow-y-auto no-scrollbar",
          "my-2",
          "border border-white border-opacity-10 shadow-inner rounded"
        )}
        style={{ maxHeight: "10rem" }}
      >
        <div className="flex flex-col">
          {allAccounts.map((acc) => {
            const selected = acc.publicKeyHash === account.publicKeyHash;
            const handleAccountClick = () => {
              if (!selected) {
                setAccountPkh(acc.publicKeyHash);
              }
              setOpened(false);
            };

            return (
              <button
                key={acc.publicKeyHash}
                className={classNames(
                  "block w-full",
                  "overflow-hidden",
                  "flex items-center",
                  "text-white text-shadow-black",
                  "transition ease-in-out duration-200",
                  selected && "shadow",
                  selected
                    ? "bg-white bg-opacity-10"
                    : "hover:bg-white hover:bg-opacity-5",
                  !selected && "opacity-75 hover:opacity-100"
                )}
                style={{
                  padding: "0.375rem",
                }}
                onClick={handleAccountClick}
                autoFocus={selected}
              >
                <Identicon
                  type="bottts"
                  hash={acc.publicKeyHash}
                  size={32}
                  className="flex-shrink-0 shadow-xs-white"
                />

                <div className="flex flex-col items-start ml-2">
                  <Name
                    className="text-sm font-medium leading-none"
                    style={{ paddingBottom: 3 }}
                  >
                    {acc.name}
                  </Name>

                  <div className="flex flex-wrap items-center">
                    <Balance address={acc.publicKeyHash}>
                      {(bal) => (
                        <span
                          className={classNames(
                            "text-xs leading-tight",
                            "text-white text-opacity-75"
                          )}
                        >
                          <Money>{bal}</Money>{" "}
                          <span style={{ fontSize: "0.5rem" }}>XTZ</span>
                        </span>
                      )}
                    </Balance>

                    <AccountTypeBadge account={acc} darkTheme />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-2">
        {actions.map(({ key, Icon, content, linkTo, onClick }) => {
          const baseProps = {
            key,
            className: classNames(
              "block w-full",
              "my-1",
              "rounded overflow-hidden",
              "flex items-center",
              "px-2",
              "transition ease-in-out duration-200",
              "hover:bg-white hover:bg-opacity-10",
              "text-white text-shadow-black text-sm"
            ),
            style: {
              paddingTop: "0.375rem",
              paddingBottom: "0.375rem",
            },
            onClick,
            children: (
              <>
                <div className="flex items-center w-8">
                  <Icon className="w-auto h-6 stroke-current" />
                </div>

                {content}
              </>
            ),
          };

          return linkTo ? (
            <Link {...baseProps} to={linkTo} />
          ) : (
            <button {...baseProps} />
          );
        })}
      </div>
    </DropdownWrapper>
  );
};

export default AccountDropdown;
