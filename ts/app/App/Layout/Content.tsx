import * as React from "react";
import classNames from "clsx";
import WidthContainer from "lib/layouts/WidthContainer";

interface ContentProps {
  popup?: boolean;
}

const Content: React.FC<ContentProps> = ({ popup, children }) => (
  <WidthContainer as="main" className="flex justify-center mb-8">
    <div
      className={classNames(
        "bg-white w-full px-4 py-8",
        !popup && "max-w-xl rounded overflow-hidden shadow-lg"
      )}
    >
      {children}
    </div>
  </WidthContainer>
);

export default Content;
