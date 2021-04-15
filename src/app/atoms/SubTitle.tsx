import React, { FC, HTMLAttributes } from "react";

import classNames from "clsx";

import { ReactComponent as ComponentIcon } from "app/icons/component.svg";

type SubTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  uppercase?: boolean;
  small?: boolean;
};

const SubTitle: FC<SubTitleProps> = ({
  className,
  children,
  uppercase = true,
  small = false,
  ...rest
}) => {
  const comp = (
    <span className="text-gray-500 px-1">
      <ComponentIcon className="h-5 w-auto stroke-current" />
    </span>
  );

  return (
    <h2
      className={classNames(
        "flex items-center justify-center",
        "text-gray-700",
        small ? "text-xl" : "text-2xl",
        "font-light",
        uppercase && "uppercase",
        className
      )}
      {...rest}
    >
      {comp}
      {children}
      {comp}
    </h2>
  );
};

export default SubTitle;
