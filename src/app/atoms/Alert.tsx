import * as React from "react";
import classNames from "clsx";
import { t } from "lib/ui/i18n";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: "success" | "warn" | "error";
  title: React.ReactNode;
  description: React.ReactNode;
  autoFocus?: boolean;
  closable?: boolean;
  onClose?: () => void;
};

const Alert: React.FC<AlertProps> = ({
  type = "warn",
  title,
  description,
  autoFocus,
  className,
  closable,
  onClose,
  ...rest
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
        "relative w-full px-4 py-3",
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
      {title && <h2 className="text-lg font-semibold mb-1">{title}</h2>}
      {description && (
        <div className="text-sm font-light break-words">{description}</div>
      )}
      {closable && (
        <button className="absolute top-3 right-3" onClick={onClose}>
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
