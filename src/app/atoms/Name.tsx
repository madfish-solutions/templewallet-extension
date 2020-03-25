import * as React from "react";
import classNames from "clsx";

type NameProps = React.HTMLAttributes<HTMLDivElement>;

const Name: React.FC<NameProps> = ({ className, style = {}, ...rest }) => (
  <div
    className={classNames(
      "whitespace-no-wrap overflow-x-auto no-scrollbar",
      className
    )}
    style={{ maxWidth: "12rem", ...style }}
    {...rest}
  />
);

export default Name;
