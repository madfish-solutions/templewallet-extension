import * as React from "react";
import classNames from "clsx";

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
      "px-6",
      "bg-white rounded",
      "border border-gray-200",
      "flex items-center",
      loading
        ? "text-transparent"
        : "text-primary-orange text-shadow-black-orange",
      "text-base font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled ? "opacity-75" : "opacity-90 hover:opacity-100",
      "shadow-sm",
      !(loading || disabled) && "hover:shadow",
      className
    )}
    style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem", ...style }}
    disabled={disabled}
    {...rest}
  >
    {children}

    {/* {loading && (
      <span
        className={classNames(
          "absolute inset-0",
          "flex itmes-center justify-center"
        )}
      >
        Loading...
      </span>
    )} */}
  </button>
);

export default FormSecondaryButton;
