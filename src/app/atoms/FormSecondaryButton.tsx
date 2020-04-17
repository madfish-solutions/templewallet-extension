import * as React from "react";
import classNames from "clsx";

type FormSecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const FormSecondaryButton: React.FC<FormSecondaryButtonProps> = ({
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
      "text-primary-orange",
      "text-base font-semibold",
      "transition duration-200 ease-in-out",
      disabled ? "opacity-75" : "opacity-90 hover:opacity-100",
      "shadow-sm",
      !disabled && "hover:shadow",
      className
    )}
    style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem", ...style }}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default FormSecondaryButton;
