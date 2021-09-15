import React, { FC, HTMLAttributes, useMemo } from "react";

import classNames from "clsx";

import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import { t } from "lib/i18n/react";
import useTippy from "lib/ui/useTippy";

type CleanButtonProps = HTMLAttributes<HTMLButtonElement> & {
  bottomOffset?: string;
  iconStyle?: React.CSSProperties;
};

const CleanButton: FC<CleanButtonProps> = ({
  bottomOffset = "0.4rem",
  className,
  style = {},
  iconStyle = {},
  ...rest
}) => {
  const tippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: t("clean"),
      animation: "shift-away-subtle",
    }),
    []
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={classNames(
        "absolute",
        "border rounded-full shadow-sm hover:shadow",
        "bg-white",
        "p-px",
        "flex items-center",
        "text-xs text-gray-700",
        "transition ease-in-out duration-200",
        className
      )}
      style={{ right: "0.4rem", bottom: bottomOffset, ...style }}
      tabIndex={-1}
      {...rest}
    >
      <CloseIcon className="w-auto h-4 stroke-current" style={iconStyle} />
    </button>
  );
};

export default CleanButton;
