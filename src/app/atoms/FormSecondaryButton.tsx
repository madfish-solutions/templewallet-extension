import * as React from "react";
import classNames from "clsx";
import Spinner from "app/atoms/Spinner";

type FormSecondaryButtonProps = React.ButtonHTMLAttributes<
  HTMLButtonElement
> & {
  loading?: boolean;
};

const FormSecondaryButton: React.FC<FormSecondaryButtonProps> = ({
  loading,
  type = "button",
  disabled,
  className,
  style,
  children,
  ...rest
}) => (
  <button
    type={type}
    className={classNames(
      "relative",
      "px-8",
      "bg-white rounded",
      "border-2 border-primary-orange",
      "flex items-center",
      loading ? "text-transparent" : "text-primary-orange",
      "text-base font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled ? "opacity-75" : "opacity-90 hover:opacity-100",
      loading || disabled
        ? "shadow-inner"
        : "shadow-sm hover:shadow focus:shadow",
      className
    )}
    style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem", ...style }}
    disabled={disabled}
    {...rest}
  >
    {children}

    {loading && (
      <div
        className={classNames(
          "absolute inset-0",
          "flex items-center justify-center"
        )}
      >
        <Spinner theme="primary" style={{ width: "3rem" }} />
      </div>
    )}
  </button>
);

export default FormSecondaryButton;
