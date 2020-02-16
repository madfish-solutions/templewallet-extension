import * as React from "react";
import classNames from "clsx";

type FormSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  loading,
  disabled,
  className,
  style,
  children,
  ...rest
}) => (
  <button
    className={classNames(
      "relative",
      "px-8",
      "bg-primary-orange rounded",
      "flex items-center",
      loading
        ? "text-transparent"
        : "text-primary-orange-lighter text-shadow-black-orange",
      "text-base font-semibold",
      "transition duration-300 ease-in-out",
      loading || disabled ? "opacity-75" : "opacity-90 hover:opacity-100",
      "shadow-sm",
      !(loading || disabled) && "hover:shadow",
      className
    )}
    style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem", ...style }}
    disabled={disabled}
    {...rest}
  >
    {children}

    {loading && (
      <span
        className={classNames(
          "absolute inset-0",
          "flex itmes-center justify-center"
        )}
      ></span>
    )}
  </button>
);

export default FormSubmitButton;
