import * as React from "react";
import classNames from "clsx";

type DropdownWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  opened: boolean;
};

const DropdownWrapper: React.FC<DropdownWrapperProps> = ({
  opened,
  className,
  style = {},
  ...rest
}) =>
  opened ? (
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
  ) : null;

export default DropdownWrapper;
