import * as React from "react";
import classNames from "clsx";
import Popper from "lib/Popper";
import { goBack } from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { useAppEnv, openInFullPage } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import Identicon from "app/atoms/Identicon";
import styles from "./PageLayout.module.css";
import SelectNetworkDropdown from "./PageLayout/SelectNetworkDropdown";
import { ReactComponent as ChevronLeftIcon } from "app/icons/chevron-left.svg";
import { ReactComponent as PeopleIcon } from "app/icons/people.svg";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { ReactComponent as MaximiseIcon } from "app/icons/maximise.svg";

type PageLayoutProps = {
  hasBackAction?: boolean;
};

const PageLayout: React.FC<PageLayoutProps> = ({ hasBackAction, children }) => (
  <div className="mb-12">
    <Header />

    <ContentPaper>
      <Toolbar hasBackAction={hasBackAction} />

      <div className="p-4">{children}</div>
    </ContentPaper>
  </div>
);

export default PageLayout;

const Header: React.FC = () => {
  const appEnv = useAppEnv();
  const { ready, account } = useThanosFront();

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
          <div className="flex items-center flex-shrink-0 text-white mr-6">
            <img src="../misc/icon.png" alt="" width="36" height="36" />

            {appEnv.fullPage && (
              <span className="font-semibold ml-2 text-xl tracking-tight">
                Thanos
              </span>
            )}
          </div>

          <div className="flex-1" />

          {ready && (
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

                <SelectNetworkDropdown />
              </div>

              <Popper
                popper={{
                  placement: "bottom-end",
                  strategy: "fixed"
                }}
                trigger={({ opened }) => (
                  <button
                    className={classNames(
                      "bg-white-10",
                      "border border-white-25",
                      "rounded-md",
                      "p-px",
                      "transition ease-in-out duration-200",
                      opened
                        ? "shadow-md"
                        : "shadow hover:shadow-md focus:shadow-md",
                      opened
                        ? "opacity-100"
                        : "opacity-90 hover:opacity-100 focus:opacity-100",
                      "cursor-pointer"
                    )}
                  >
                    <Identicon hash={account!.publicKeyHash} size={48} />
                  </button>
                )}
                className="flex items-center"
              >
                {({ setOpened }) => <AccountDropdown setOpened={setOpened} />}
              </Popper>
            </>
          )}
        </div>
      </ContentContainer>
    </header>
  );
};

type ContentPaparProps = React.ComponentProps<typeof ContentContainer>;

const ContentPaper: React.FC<ContentPaparProps> = ({
  className,
  style = {},
  children,
  ...rest
}) => {
  const appEnv = useAppEnv();

  return appEnv.fullPage ? (
    <ContentContainer>
      <div
        className={classNames("bg-white", "rounded-md shadow-lg", className)}
        style={{ minHeight: "20rem", ...style }}
        {...rest}
      >
        {children}
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer
      padding={false}
      className={classNames("bg-white", className)}
      style={style}
      {...rest}
    >
      {children}
    </ContentContainer>
  );
};

type ToolbarProps = {
  hasBackAction?: boolean;
};

const Toolbar: React.FC<ToolbarProps> = ({ hasBackAction }) => {
  const appEnv = useAppEnv();

  const handleBackAction = React.useCallback(() => {
    goBack();
  }, []);

  const [sticked, setSticked] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const toolbarEl = rootRef.current;
    if ("IntersectionObserver" in window && toolbarEl) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setSticked(entry.boundingClientRect.y < entry.rootBounds!.y);
        },
        { threshold: [1] }
      );

      observer.observe(toolbarEl);
      return () => {
        observer.unobserve(toolbarEl);
      };
    }
  }, [setSticked]);

  return (
    <div
      ref={rootRef}
      className={classNames(
        "sticky z-20",
        appEnv.fullPage && !sticked && "rounded-t",
        sticked ? "shadow" : "shadow-sm",
        "bg-gray-100",
        "overflow-hidden",
        "p-1",
        "flex items-center",
        "transition ease-in-out duration-300"
      )}
      style={{
        // The top value needs to be -1px or the element will never intersect
        // with the top of the browser window
        // (thus never triggering the intersection observer).
        top: -1
      }}
    >
      {hasBackAction && (
        <button
          className={classNames(
            "px-4 py-2",
            "rounded",
            "flex items-center",
            "text-gray-600 text-shadow-black",
            "text-sm font-semibold",
            "hover:bg-black-5",
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
    </div>
  );
};

type AccountDropdown = {
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
};

const AccountDropdown: React.FC<AccountDropdown> = ({ setOpened }) => {
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

  const handleMaximiseViewClick = React.useCallback(() => {
    openInFullPage();
  }, []);

  return (
    <div
      className={classNames(
        "mt-2",
        "border",
        "rounded overflow-hidden shadow-xl",
        "p-2"
      )}
      style={{
        minWidth: "16rem",
        backgroundColor: "#292929",
        borderColor: "#202020"
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
          "border-t border-b border-white-25"
        )}
        style={{ maxHeight: "10rem" }}
      >
        <div className="my-2 flex flex-col">
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
                  "rounded overflow-hidden",
                  "flex items-center",
                  "p-1",
                  "text-white",
                  "transition ease-in-out duration-200",
                  selected ? "bg-white-10" : "hover:bg-white-5"
                )}
                style={{
                  marginTop: "0.125rem",
                  marginBottom: "0.125rem"
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
        <button
          className={classNames(
            "block w-full",
            "my-1",
            "rounded overflow-hidden",
            "flex items-center",
            "p-1",
            "transition ease-in-out duration-200",
            "hover:bg-white-10",
            "text-white text-shadow-black text-sm"
          )}
          onClick={handleCreateAccountClick}
        >
          <AddIcon className="mr-2 h-6 w-auto stroke-current" /> Create account
        </button>

        {!appEnv.fullPage && (
          <button
            className={classNames(
              "block w-full",
              "my-1",
              "rounded overflow-hidden",
              "flex items-center",
              "p-1",
              "transition ease-in-out duration-200",
              "hover:bg-white-5",
              "text-white text-sm"
            )}
            onClick={handleMaximiseViewClick}
          >
            <MaximiseIcon className="mr-2 h-6 w-auto stroke-current" /> Maximise
            view
          </button>
        )}
      </div>
    </div>
  );
};
