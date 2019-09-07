import * as React from "react";
// import classNames from "clsx";
import WidthContainer from "layouts/WidthContainer";

const PageMain: React.FC = ({ children }) => (
  <WidthContainer as="main" className="flex justify-center mb-8">
    <div className="bg-white w-full max-w-xl rounded overflow-hidden shadow-lg px-4 py-8">
      {children}
    </div>
  </WidthContainer>
);

export default PageMain;
