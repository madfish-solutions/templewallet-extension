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
      "px-8",
      "bg-primary-orange rounded",
      "border border-primary-orange",
      "flex items-center",
      "text-primary-orange-lighter text-shadow-black-orange",
      "text-base font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled
        ? "opacity-75"
        : "opacity-90 hover:opacity-100 focus:opacity-100",
      "shadow-sm",
      !(loading || disabled) && "hover:shadow focus:shadow",
      className
    )}
    style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem", ...style }}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default FormSubmitButton;
