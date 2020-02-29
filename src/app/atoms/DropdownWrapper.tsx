import * as React from "react";
import classNames from "clsx";

type DropdownWrapperProps = React.HTMLAttributes<HTMLDivElement>;

const DropdownWrapper: React.FC<DropdownWrapperProps> = ({
  className,
  style = {},
  ...rest
}) => (
  <div
    className={classNames(
      "mt-2",
      "border",
      "rounded-md overflow-hidden",
      "shadow-xl",
      "p-2",
      className
    )}
    style={{
      backgroundColor: "#1b262c",
      borderColor: "#212e36",
      ...style
    }}
    {...rest}
  />
);

export default DropdownWrapper;
