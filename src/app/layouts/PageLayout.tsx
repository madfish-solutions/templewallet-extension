import * as React from "react";
import classNames from "clsx";
import { goBack } from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { useAppEnv } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import Identicon from "app/atoms/Identicon";
import styles from "./PageLayout.module.css";
import SelectNetworkDropdown from "./PageLayout/SelectNetworkDropdown";
import { ReactComponent as ChevronLeftIcon } from "app/icons/chevron-left.svg";

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
        <div className="flex items-strech">
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

              <div className="flex items-center">
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
                  <Identicon hash={account!.publicKeyHash} size={48} />
                </div>
              </div>
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
  const { ready, lock } = useThanosFront();

  const handleBackAction = React.useCallback(() => {
    goBack();
  }, []);

  const handleLogoutClick = React.useCallback(() => {
    lock();
  }, [lock]);

  const [sticked, setSticked] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const toolbarEl = rootRef.current;
    if ("IntersectionObserver" in window && toolbarEl) {
      const observer = new IntersectionObserver(
        ([evt]) => {
          setSticked(evt.intersectionRatio < 1);
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

      {ready && (
        <button
          className={classNames(
            "px-4 py-2",
            "rounded",
            "flex items-center",
            "text-primary-orange text-shadow-black-orange",
            "text-sm font-semibold",
            "hover:bg-primary-orange-darker-5",
            "transition duration-300 ease-in-out",
            "opacity-90 hover:opacity-100"
          )}
          onClick={handleLogoutClick}
        >
          Log out
        </button>
      )}
    </div>
  );
};
