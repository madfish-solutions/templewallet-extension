import React, { ButtonHTMLAttributes, FC } from "react";

import classNames from "clsx";

import { ReactComponent as StarIcon } from "app/icons/star.svg";

type StarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconClassName?: string;
  isActive: boolean;
};

const StarButton: FC<StarButtonProps> = ({
  iconClassName,
  className,
  isActive,
  ...restProps
}) => (
  <button
    className={classNames(
      isActive ? "text-orange-500" : "text-gray-500",
      className
    )}
    type="button"
    {...restProps}
  >
    <StarIcon className={classNames("fill-current", iconClassName)} />
  </button>
);

export default StarButton;
