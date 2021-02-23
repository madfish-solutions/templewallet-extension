import * as React from "react";
import classNames from "clsx";
import { useAppEnv } from "app/env";
import DocBg from "app/a11y/DocBg";
import ContentContainer from "app/layouts/ContentContainer";
import Logo from "app/atoms/Logo";

type SimplePageLayoutProps = {
  title: React.ReactNode;
};

const SimplePageLayout: React.FC<SimplePageLayoutProps> = ({
  title,
  children,
}) => {
  const appEnv = useAppEnv();

  return (
    <>
      {!appEnv.fullPage && <DocBg bgClassName="bg-primary-white" />}

      <ContentContainer
        className={classNames(
          "min-h-screen",
          "flex flex-col",
          !appEnv.fullPage && "bg-primary-white"
        )}
      >
        <div
          className={classNames(
            "mt-12 mb-10",
            "flex flex-col items-center justify-center"
          )}
        >
          <div className="flex items-center">
            <Logo hasTitle />
          </div>

          <div
            className={classNames(
              "mt-4",
              "text-center",
              "text-2xl font-light leading-tight",
              "text-gray-700"
            )}
          >
            {title}
          </div>
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
