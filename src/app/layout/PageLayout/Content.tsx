import * as React from "react";
import classNames from "clsx";
import { WindowType, useAppEnvContext } from "app/env";
import ContentContainer from "app/layout/ContentContainer";

const Content: React.FC = ({ children }) => {
  const { windowType } = useAppEnvContext();
  const fullPageWindow = windowType === WindowType.FullPage;

  return (
    <ContentContainer className="flex justify-center mb-8">
      <div
        className={classNames(
          "bg-white w-full px-4 py-8",
          fullPageWindow && "max-w-xl rounded overflow-hidden shadow-lg"
        )}
      >
        {children}
      </div>
    </ContentContainer>
  );
};

export default Content;
