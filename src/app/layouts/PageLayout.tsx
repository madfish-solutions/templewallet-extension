import * as React from "react";
import classNames from "clsx";
import { goBack } from "lib/woozie";
import { useAppEnv } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";
import { ReactComponent as ChevronLeftIcon } from "app/icons/chevron-left.svg";
import Header from "./PageLayout/Header";

type PageLayoutProps = ToolbarProps;

const PageLayout: React.FC<PageLayoutProps> = ({
  pageTitle,
  hasBackAction,
  children
}) => (
  <div className="mb-12">
    <Header />

    <ContentPaper>
      <Toolbar pageTitle={pageTitle} hasBackAction={hasBackAction} />

      <div className="p-4">{children}</div>
    </ContentPaper>
  </div>
);

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

type ToolbarProps = {
  pageTitle?: React.ReactNode;
  hasBackAction?: boolean;
};

const Toolbar: React.FC<ToolbarProps> = ({
  pageTitle,
  hasBackAction = true
}) => {
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
      <div className="flex-1">
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
      </div>

      {pageTitle && (
        <h2
          className={classNames(
            "px-1",
            "text-gray-600",
            "text-base font-normal"
          )}
        >
          {pageTitle}
        </h2>
      )}

      <div className="flex-1" />
    </div>
  );
};
