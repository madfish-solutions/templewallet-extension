import * as React from "react";
import classNames from "clsx";
import { WindowType, useAppEnvContext } from "app/env";
import ContentContainer from "app/layouts/ContentContainer";

type SimplePageLayoutProps = {
  title?: React.ReactNode;
};

const SimplePageLayout: React.FC<SimplePageLayoutProps> = ({
  title,
  children
}) => {
  const appEnv = useAppEnvContext();
  const fullPage = appEnv.windowType === WindowType.FullPage;

  return (
    <ContentContainer
      className={classNames(
        "min-h-screen",
        "flex flex-col items-center justify-center"
      )}
    >
      {title && (
        <h1 className="mt-2 mb-12 text-4xl text-gray-700 font-light">
          {title}
        </h1>
      )}

      {fullPage ? (
        <div
          className={classNames(
            "w-full mx-auto max-w-md",
            "bg-white",
            "rounded-md shadow-md",
            "px-4"
          )}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </ContentContainer>
  );
};

export default SimplePageLayout;
