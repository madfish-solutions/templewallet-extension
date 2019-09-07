import * as React from "react";
// import classNames from "clsx";
import WidthContainer from "layouts/WidthContainer";

const PageMain: React.FC = ({ children }) => (
  <WidthContainer as="main" className="flex justify-center">
    <div className="bg-white w-full max-w-xl rounded overflow-hidden shadow-lg">
      <div className="p-4">{children}</div>
    </div>
  </WidthContainer>
);

export default PageMain;
