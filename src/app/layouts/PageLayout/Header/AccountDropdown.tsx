import * as React from "react";
import classNames from "clsx";
import { navigate } from "lib/woozie";
import {
  ThanosAccountType,
  useThanosClient,
  useReadyThanos,
} from "lib/thanos/front";
import { PopperRenderProps } from "lib/ui/Popper";
import { useAppEnv, openInFullPage } from "app/env";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";
import Balance from "app/templates/Balance";
import { ReactComponent as PeopleIcon } from "app/icons/people.svg";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import { ReactComponent as MaximiseIcon } from "app/icons/maximise.svg";

type AccountDropdown = PopperRenderProps;

const AccountDropdown: React.FC<AccountDropdown> = ({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const { lock } = useThanosClient();
  const { allAccounts, account, setAccountPkh } = useReadyThanos();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      setOpened(false);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh, setOpened]);

  const handleLogoutClick = React.useCallback(() => {
    lock();
  }, [lock]);

  const handleCreateAccountClick = React.useCallback(() => {
    // (async () => {
    //   try {
    //     await createAccount();
    //   } catch (err) {
    //     if (process.env.NODE_ENV === "development") {
    //       console.error(err);
    //     }

    //     alert(err.message);
    //   }
    // })();
    navigate("/create-account");
    setOpened(false);
  }, [setOpened]);

  const handleSettingsClick = React.useCallback(() => {
    navigate("/settings");
    setOpened(false);
  }, [setOpened]);

  const handleImportAccountClick = React.useCallback(() => {
    navigate("/import-account");
    setOpened(false);
  }, [setOpened]);

  const handleMaximiseViewClick = React.useCallback(() => {
    openInFullPage();
  }, []);

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top-right"
      style={{
        minWidth: "16rem",
      }}
    >
      <div className="mb-2 flex items-end">
        <h3
          className={classNames(
            "mx-1",
            "flex items-center",
            "text-sm text-white-90"
          )}
        >
          Accounts
          <PeopleIcon className="ml-1 h-6 w-auto stroke-current" />
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
            "hover:bg-white-5",
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
          "overflow-y-auto",
          "my-2",
          "border border-white-10 shadow-inner rounded"
        )}
        style={{ maxHeight: "11rem" }}
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
                  selected ? "bg-white-10" : "hover:bg-white-5",
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
                  className="flex-shrink-0"
                  style={{
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.05)",
                  }}
                />

                <div className="ml-2 flex flex-col items-start">
                  <Name className="text-sm font-medium leading-tight">
                    {acc.name}
                  </Name>

                  <div className="flex flex-wrap items-center">
                    <Balance address={acc.publicKeyHash}>
                      {(bal) => (
                        <span
                          className={classNames(
                            "text-xs leading-none",
                            "text-white-75"
                          )}
                        >
                          <Money>{bal}</Money>{" "}
                          <span style={{ fontSize: "0.5rem" }}>XTZ</span>
                        </span>
                      )}
                    </Balance>

                    {acc.type === ThanosAccountType.Imported && (
                      <span
                        className={classNames(
                          "ml-2",
                          "rounded-sm",
                          "border border-white-25",
                          "px-1 py-px",
                          "leading-tight",
                          "text-white-50"
                        )}
                        style={{ fontSize: "0.6rem" }}
                      >
                        Imported
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="my-2">
        {[
          {
            Icon: AddIcon,
            content: "Create account",
            onClick: handleCreateAccountClick,
          },
          {
            Icon: DownloadIcon,
            content: "Import account",
            onClick: handleImportAccountClick,
          },
          {
            Icon: SettingsIcon,
            content: "Settings",
            onClick: handleSettingsClick,
          },
          !appEnv.fullPage && {
            Icon: MaximiseIcon,
            content: "Maximise view",
            onClick: handleMaximiseViewClick,
          },
        ]
          .filter(Boolean)
          .map((item, i) => {
            if (!item) return null;
            const { Icon, content, onClick } = item;

            return (
              <button
                key={i}
                className={classNames(
                  "block w-full",
                  "my-1",
                  "rounded overflow-hidden",
                  "flex items-center",
                  "px-2",
                  "transition ease-in-out duration-200",
                  "hover:bg-white-10",
                  "text-white text-shadow-black text-sm"
                )}
                style={{
                  paddingTop: "0.375rem",
                  paddingBottom: "0.375rem",
                }}
                onClick={onClick}
              >
                <div className="w-8 flex items-center">
                  <Icon className="h-6 w-auto stroke-current" />
                </div>

                {content}
              </button>
            );
          })}
      </div>
    </DropdownWrapper>
  );
};

export default AccountDropdown;
