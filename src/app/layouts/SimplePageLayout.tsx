import * as React from "react";
import classNames from "clsx";
import { useAppEnv } from "app/env";
import OverscrollBg from "app/a11y/OverscrollBg";
import ContentContainer from "app/layouts/ContentContainer";
import Logo from "app/atoms/Logo";

type SimplePageLayoutProps = {
  title: React.ReactNode;
};

const SimplePageLayout: React.FC<SimplePageLayoutProps> = ({
  title,
  children
}) => {
  const appEnv = useAppEnv();

  return (
    <>
      {!appEnv.fullPage && (
        <OverscrollBg
          topClassName="bg-primary-white"
          bottomClassName="bg-white"
        />
      )}

      <ContentContainer
        className={classNames(
          "min-h-screen",
          "flex flex-col",
          !appEnv.fullPage && "bg-primary-white"
        )}
      >
        <div
          className={classNames(
            "mt-12 mb-4",
            "flex flex-col items-center justify-center"
          )}
        >
          <div className="mb-4 flex items-center">
            <Logo />

            <h1
              className={classNames(
                "ml-1",
                "text-2xl font-semibold tracking-tight",
                "text-gray-700"
              )}
            >
              Thanos
            </h1>
          </div>

          <div className="text-2xl text-gray-700 font-light">{title}</div>
        </div>

        <div
          className={classNames(
            appEnv.fullPage
              ? classNames("w-full mx-auto max-w-md", "rounded-md")
              : classNames("-mx-4", "border-t border-gray-200"),
            "px-4",
            "bg-white",
            "shadow-md"
          )}
        >
          {children}
        </div>

        <div
          className={classNames(
            "flex-1",
            !appEnv.fullPage && "-mx-4 px-4 bg-white"
          )}
        />
      </ContentContainer>
    </>
  );
};

export default SimplePageLayout;
