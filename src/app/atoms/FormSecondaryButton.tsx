import React, { ButtonHTMLAttributes, FC } from "react";

import classNames from "clsx";

import Spinner from "app/atoms/Spinner";
import { TestIDProps } from "lib/analytics";

import { Button } from "./Button";

type FormSecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & TestIDProps & {
  loading?: boolean;
  small?: boolean;
};

const FormSecondaryButton: FC<FormSecondaryButtonProps> = ({
  loading,
  small,
  type = "button",
  disabled,
  className,
  style,
  children,
  ...rest
}) => (
  <Button
    type={type}
    className={classNames(
      "relative",
      small ? "px-6" : "px-8",
      "bg-white rounded",
      "border-2 border-primary-orange",
      "flex items-center",
      loading ? "text-transparent" : "text-primary-orange",
      small ? "text-sm" : "text-base",
      "font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled ? "opacity-75" : "opacity-90 hover:opacity-100",
      loading || disabled
        ? "shadow-inner pointer-events-none"
        : "shadow-sm hover:shadow focus:shadow",
      className
    )}
    style={{
      paddingTop: small ? "0.5rem" : "0.625rem",
      paddingBottom: small ? "0.5rem" : "0.625rem",
      ...style,
    }}
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
        <Spinner theme="primary" style={{ width: small ? "2rem" : "3rem" }} />
      </div>
    )}
  </Button>
);

export default FormSecondaryButton;
