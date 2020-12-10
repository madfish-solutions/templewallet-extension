import * as React from "react";
import classNames from "clsx";
import Checkbox from "app/atoms/Checkbox";

type FormCheckboxProps = React.ComponentProps<typeof Checkbox> & {
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
  errorCaption?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
};

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      label,
      labelDescription,
      errorCaption,
      containerClassName,
      labelClassName,
      ...rest
    },
    ref
  ) => (
    <div className={classNames("flex flex-col", containerClassName)}>
      <label
        className={classNames(
          "mb-2",
          "p-4",
          "bg-gray-100",
          "border-2 border-gray-300",
          "rounded-md overflow-hidden",
          "cursor-pointer",
          "flex items-center",
          labelClassName
        )}
      >
        <Checkbox ref={ref} errored={Boolean(errorCaption)} {...rest} />

        {label ? (
          <div className={classNames("ml-4", "leading-tight", "flex flex-col")}>
            <span className={classNames("text-sm font-semibold text-gray-700")}>
              {label}
            </span>

            {labelDescription && (
              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
              >
                {labelDescription}
              </span>
            )}
          </div>
        ) : null}
      </label>

      {errorCaption ? (
        <div className="text-xs text-red-500">{errorCaption}</div>
      ) : null}
    </div>
  )
);

export default FormCheckbox;
