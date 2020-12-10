import * as React from "react";
import classNames from "clsx";
import { ReactComponent as ComponentIcon } from "app/icons/component.svg";

type SubTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  uppercase?: boolean;
};

const SubTitle: React.FC<SubTitleProps> = ({
  className,
  children,
  uppercase = true,
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
        "text-2xl",
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
