import * as React from "react";
import WidthContainer from "lib/layouts/WidthContainer";

const Content: React.FC = ({ children }) => (
  <WidthContainer as="main" className="flex justify-center mb-8">
    <div className="bg-white w-full max-w-xl rounded overflow-hidden shadow-lg px-4 py-8">
      {children}
    </div>
  </WidthContainer>
);

export default Content;
