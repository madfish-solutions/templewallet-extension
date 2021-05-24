import React, { FC, HTMLAttributes, useMemo } from "react";

import classNames from "clsx";

import { t } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";

export type CopyButtonProps = HTMLAttributes<HTMLButtonElement> & {
  bgShade?: 100 | 200;
  rounded?: "sm" | "base";
  text: string;
  small?: boolean;
  type?: "button" | "link";
  textShade?: 500 | 600 | 700;
};

const CopyButton: FC<CopyButtonProps> = ({
  bgShade = 100,
  children,
  text,
  small = false,
  className,
  type = "button",
  rounded = "sm",
  textShade = 600,
  ...rest
}) => {
  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = useMemo(
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
                (() => {
                  switch (bgShade) {
                    case 100:
                      return "bg-gray-100 hover:bg-gray-200";

                    case 200:
                      return "bg-gray-200 hover:bg-gray-300";
                  }
                })(),
                (() => {
                  switch (textShade) {
                    case 500:
                      return "text-gray-500";

                    case 600:
                      return "text-gray-600";

                    case 700:
                      return "text-gray-700";
                  }
                })(),
                rounded === "base" ? "rounded" : "rounded-sm",
                small ? "text-xs p-1" : "text-sm py-1 px-2",
                "font-tnum leading-none select-none",
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
