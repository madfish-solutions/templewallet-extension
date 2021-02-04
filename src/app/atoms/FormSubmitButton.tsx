import * as React from "react";
import classNames from "clsx";
import Spinner from "app/atoms/Spinner";

type FormSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  small?: boolean;
};

const FormSubmitButton: React.FC<FormSubmitButtonProps> = ({
  loading,
  small,
  disabled,
  className,
  style,
  children,
  ...rest
}) => (
  <button
    className={classNames(
      "relative",
      small ? "px-6" : "px-8",
      "rounded border-2",
      disabled
        ? "bg-gray-400 border-gray-400"
        : "bg-primary-orange border-primary-orange",
      "flex items-center",
      loading ? "text-transparent" : "text-primary-orange-lighter",
      small ? "text-sm" : "text-base",
      "font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled
        ? "opacity-75"
        : "opacity-90 hover:opacity-100 focus:opacity-100",
      loading || disabled
        ? "pointer-events-none"
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
        <Spinner theme="white" style={{ width: small ? "2rem" : "3rem" }} />
      </div>
    )}
  </button>
);

export default FormSubmitButton;
