import * as React from "react";
import classNames from "clsx";
import { navigate } from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { PopperRenderProps } from "lib/ui/Popper";
import { useAppEnv, openInFullPage } from "app/env";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import Identicon from "app/atoms/Identicon";
import { ReactComponent as PeopleIcon } from "app/icons/people.svg";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import { ReactComponent as MaximiseIcon } from "app/icons/maximise.svg";

type AccountDropdown = PopperRenderProps;

const AccountDropdown: React.FC<AccountDropdown> = ({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const {
    accounts,
    account,
    lock,
    setAccIndex,
    createAccount
  } = useThanosFront();

  const prevAccLengthRef = React.useRef(accounts.length);
  React.useEffect(() => {
    const accLength = accounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccIndex(accLength - 1);
      setOpened(false);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [accounts, setAccIndex, setOpened]);

  const handleLogoutClick = React.useCallback(() => {
    lock();
  }, [lock]);

  const handleCreateAccountClick = React.useCallback(() => {
    (async () => {
      try {
        await createAccount();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        alert(err.message);
      }
    })();
  }, [createAccount]);

  const handleSettingsClick = React.useCallback(() => {
    navigate("/settings");
    setOpened(false);
  }, [setOpened]);

  const handleMaximiseViewClick = React.useCallback(() => {
    openInFullPage();
  }, []);

  return (
    <DropdownWrapper
      opened={opened}
      style={{
        minWidth: "16rem"
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
        style={{ maxHeight: "10rem" }}
      >
        <div className="flex flex-col">
          {accounts.map((acc, i) => {
            const selected = acc.publicKeyHash === account.publicKeyHash;
            const handleAccountClick = () => {
              if (!selected) {
                setAccIndex(i);
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
                  padding: "0.375rem"
                }}
                onClick={handleAccountClick}
                autoFocus={selected}
              >
                <Identicon
                  hash={acc.publicKeyHash}
                  size={32}
                  style={{
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.25)"
                  }}
                />

                <span className="ml-2 text-base font-medium">{acc.name}</span>
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
            onClick: handleCreateAccountClick
          },
          {
            Icon: DownloadIcon,
            content: "Import account"
            // onClick: handleImportAccountClick
          },
          {
            Icon: SettingsIcon,
            content: "Settings",
            onClick: handleSettingsClick
          },
          !appEnv.fullPage && {
            Icon: MaximiseIcon,
            content: "Maximise view",
            onClick: handleMaximiseViewClick
          }
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
                  paddingBottom: "0.375rem"
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
