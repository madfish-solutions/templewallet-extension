import * as React from "react";
import classNames from "clsx";
import Spinner from "app/atoms/Spinner";

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
      "border-2 border-primary-orange",
      "flex items-center",
      loading ? "text-transparent" : "text-primary-orange-lighter",
      "text-base font-semibold",
      "transition duration-200 ease-in-out",
      loading || disabled
        ? "opacity-75"
        : "opacity-90 hover:opacity-100 focus:opacity-100",
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
        <Spinner theme="white" style={{ width: "3rem" }} />
      </div>
    )}
  </button>
);

export default FormSubmitButton;
