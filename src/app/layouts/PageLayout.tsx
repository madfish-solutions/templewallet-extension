import * as React from "react";
import classNames from "clsx";
import { HistoryAction, useLocation, goBack, navigate } from "lib/woozie";
import { T } from "lib/i18n/react";
import { useAppEnv } from "app/env";
import ErrorBoundary from "app/ErrorBoundary";
import DocBg from "app/a11y/DocBg";
import ContentContainer from "app/layouts/ContentContainer";
import NoLambdaViewContractAlert from "app/templates/NoLambdaViewContractAlert";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as ChevronLeftIcon } from "app/icons/chevron-left.svg";
import Header from "app/layouts/PageLayout/Header";
import ConfirmationOverlay from "app/layouts/PageLayout/ConfirmationOverlay";

type PageLayoutProps = ToolbarProps;

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  ...toolbarProps
}) => {
  const { fullPage } = useAppEnv();

  return (
    <>
      <DocBg bgClassName="bg-primary-orange" />

      <div className={classNames(fullPage && "pb-20")}>
        <Header />

        <ContentPaper>
          <Toolbar {...toolbarProps} />

          <div className="p-4">
            <ErrorBoundary whileMessage="displaying this page">
              <React.Suspense fallback={<SpinnerSection />}>
                {children}
              </React.Suspense>
            </ErrorBoundary>
          </div>
        </ContentPaper>
      </div>

      <NoLambdaViewContractAlert />
      <ConfirmationOverlay />
    </>
  );
};

export default PageLayout;

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

const SpinnerSection: React.FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);

type ToolbarProps = {
  pageTitle?: React.ReactNode;
  hasBackAction?: boolean;
};

const Toolbar: React.FC<ToolbarProps> = ({
  pageTitle,
  hasBackAction = true,
}) => {
  const { historyPosition, pathname } = useLocation();
  const { fullPage, registerBackHandler, onBack } = useAppEnv();

  const inHome = pathname === "/";
  const canBack = historyPosition > 0 || !inHome;

  React.useLayoutEffect(() => {
    return registerBackHandler(() => {
      switch (true) {
        case historyPosition > 0:
          goBack();
          break;

        case !inHome:
          navigate("/", HistoryAction.Replace);
          break;
      }
    });
  }, [registerBackHandler, historyPosition, inHome]);

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
    return;
  }, [setSticked]);

  return (
    <div
      ref={rootRef}
      className={classNames(
        "sticky z-20",
        fullPage && !sticked && "rounded-t",
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
        top: -1,
        minHeight: "2.75rem",
      }}
    >
      <div className="flex-1">
        {hasBackAction && canBack && (
          <button
            className={classNames(
              "px-4 py-2",
              "rounded",
              "flex items-center",
              "text-gray-600 text-shadow-black",
              "text-sm font-semibold leading-none",
              "hover:bg-black hover:bg-opacity-5",
              "transition duration-300 ease-in-out",
              "opacity-90 hover:opacity-100"
            )}
            onClick={onBack}
          >
            <ChevronLeftIcon
              className={classNames(
                "-ml-2",
                "h-5 w-auto",
                "stroke-current",
                "stroke-2"
              )}
            />
            <T id="back" />
          </button>
        )}
      </div>

      {pageTitle && (
        <h2
          className={classNames(
            "px-1",
            "flex items-center",
            "text-gray-600",
            "text-sm font-light leading-none"
          )}
        >
          {pageTitle}
        </h2>
      )}

      <div className="flex-1" />
    </div>
  );
};
