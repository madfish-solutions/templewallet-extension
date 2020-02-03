import * as React from "react";
import classNames from "clsx";

const ContentContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    className={classNames("w-full max-w-3xl mx-auto px-4", className)}
    {...rest}
  />
);

export default ContentContainer;
