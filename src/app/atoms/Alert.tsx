import * as React from "react";
import classNames from "clsx";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: "warn" | "error";
  title: React.ReactNode;
  description: React.ReactNode;
};

const Alert: React.FC<AlertProps> = ({
  type = "warn",
  title,
  description,
  className,
  ...rest
}) => {
  const [bgColorClassName, borderColorClassName, textColorClassName] = (() => {
    switch (type) {
      case "warn":
        return ["bg-yellow-100", "border-yellow-500", "text-yellow-700"];
      case "error":
        return ["bg-red-100", "border-red-500", "text-red-700"];
    }
  })();

  return (
    <div
      className={classNames(
        "w-full px-4 py-3",
        bgColorClassName,
        "border",
        borderColorClassName,
        "rounded shadow-xs",
        textColorClassName,
        className
      )}
      role="alert"
      {...rest}
    >
      {title && <h2 className="text-lg font-semibold mb-1">{title}</h2>}
      {description && <div className="text-sm font-light">{description}</div>}
    </div>
  );
};

export default Alert;
