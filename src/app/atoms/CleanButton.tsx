import * as React from "react";
import classNames from "clsx";
import { t } from "lib/i18n/react";
import useTippy from "lib/ui/useTippy";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";

type CleanButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  bottomOffset?: string;
};

const CleanButton: React.FC<CleanButtonProps> = ({
  bottomOffset = "0.4rem",
  className,
  style = {},
  ...rest
}) => {
  const tippyProps = React.useMemo(
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
      <CloseIcon className="w-auto h-4 stroke-current" />
    </button>
  );
};

export default CleanButton;
