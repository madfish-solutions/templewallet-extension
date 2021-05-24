import React, { FC, HTMLAttributes, ReactNode, useEffect, useRef } from "react";

import classNames from "clsx";

import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import { t } from "lib/i18n/react";

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  type?: "success" | "warn" | "error";
  title: ReactNode;
  description: ReactNode;
  autoFocus?: boolean;
  closable?: boolean;
  onClose?: () => void;
};

const Alert: FC<AlertProps> = ({
  type = "warn",
  title,
  description,
  autoFocus,
  className,
  closable,
  onClose,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus]);

  const [bgColorClassName, borderColorClassName, textColorClassName] = (() => {
    switch (type) {
      case "success":
        return ["bg-green-100", "border-green-400", "text-green-700"];
      case "warn":
        return ["bg-yellow-100", "border-yellow-400", "text-yellow-700"];
      case "error":
        return ["bg-red-100", "border-red-400", "text-red-700"];
    }
  })();

  return (
    <div
      ref={ref}
      className={classNames(
        "relative w-full px-4 pt-3",
        bgColorClassName,
        "border",
        borderColorClassName,
        "rounded-md",
        textColorClassName,
        className
      )}
      tabIndex={-1}
      role="alert"
      aria-label={t("alert")}
      {...rest}
    >
      {title && <h2 className="mb-1 text-lg font-semibold">{title}</h2>}
      {description && (
        <div
          className={classNames(
            "pb-3 text-sm font-light break-words",
            "overflow-y-auto no-scrollbar"
          )}
          style={{ maxHeight: "8rem" }}
        >
          {description}
        </div>
      )}
      {closable && (
        <button
          className="absolute top-3 right-3"
          onClick={onClose}
          type="button"
        >
          <CloseIcon
            className="w-auto h-5 stroke-current"
            style={{ strokeWidth: 2 }}
          />
        </button>
      )}
    </div>
  );
};

export default Alert;
