import * as React from "react";
import classNames from "clsx";
import { WindowType, useAppEnvContext } from "app/env";
import ContentContainer from "app/layout/ContentContainer";

const Content: React.FC = ({ children }) => {
  const { windowType } = useAppEnvContext();
  const fullPageWindow = windowType === WindowType.FullPage;

  return fullPageWindow ? (
    <ContentContainer>
      <div
        className={classNames("bg-white", "rounded-md shadow-lg", "px-4")}
        style={{ minHeight: "20rem" }}
      >
        {children}
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer className="bg-white">{children}</ContentContainer>
  );
};

export default Content;
