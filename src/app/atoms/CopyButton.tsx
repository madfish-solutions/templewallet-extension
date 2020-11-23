import * as React from "react";
import { t } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";
import classNames from "clsx";

export type CopyButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  text: string;
  small?: boolean;
  type?: "button" | "link";
};

const CopyButton: React.FC<CopyButtonProps> = ({
  children,
  text,
  small = false,
  className,
  type = "button",
  ...rest
}) => {
  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = React.useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: copied ? t("copiedHash") : t("copyHashToClipboard"),
      animation: "shift-away-subtle",
      onHidden() {
        setCopied(false);
      },
    }),
    [copied, setCopied]
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={
          type === "button"
            ? classNames(
                "bg-gray-100 hover:bg-gray-200",
                "rounded-sm shadow-xs",
                small ? "text-xs p-1" : "text-sm py-1 px-2",
                "font-tnum text-gray-600 leading-none select-none",
                "transition ease-in-out duration-300",
                className
              )
            : classNames("hover:underline", className)
        }
        {...rest}
        onClick={copy}
      >
        {children}
      </button>

      <input ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
};

export default CopyButton;
