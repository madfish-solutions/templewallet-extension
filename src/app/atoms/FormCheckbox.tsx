import * as React from "react";
import classNames from "clsx";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";

interface FormCheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
  errorCaption?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      label,
      labelDescription,
      errorCaption,
      containerClassName,
      labelClassName,
      className,
      checked,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [localChecked, setLocalChecked] = React.useState(
      () => checked || false
    );
    const handleChange = React.useCallback(
      (evt) => {
        if (onChange) {
          onChange(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setLocalChecked(evt.target.checked);
      },
      [onChange, setLocalChecked]
    );

    /**
     * Focus handling
     */
    const [localFocused, setLocalFocused] = React.useState(false);

    const handleFocus = React.useCallback(
      (evt) => {
        if (onFocus) {
          onFocus(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setLocalFocused(true);
      },
      [onFocus, setLocalFocused]
    );

    const handleBlur = React.useCallback(
      (evt) => {
        if (onBlur) {
          onBlur(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setLocalFocused(false);
      },
      [onBlur, setLocalFocused]
    );

    return (
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
          <div
            className={classNames(
              "h-6 w-6 flex-shrink-0",
              localChecked ? "bg-primary-orange" : "bg-black-40",
              "border",
              (() => {
                switch (true) {
                  case localChecked:
                    return "border-primary-orange-dark";

                  case localFocused:
                    return "border-primary-orange";

                  case Boolean(errorCaption):
                    return "border-red-400";

                  default:
                    return "border-gray-400";
                }
              })(),
              "rounded-md overflow-hidden",
              "disable-outline-for-click",
              localFocused && "shadow-outline",
              "transition ease-in-out duration-200",
              "text-white",
              "flex justify-center items-center"
            )}
          >
            <input
              ref={ref}
              type="checkbox"
              className={classNames("sr-only", className)}
              checked={localChecked}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...rest}
            />

            <OkIcon
              className={classNames(
                localChecked ? "block" : "hidden",
                "h-4 w-4",
                "pointer-events-none",
                "stroke-current"
              )}
              style={{ strokeWidth: 2 }}
            />
          </div>

          {label ? (
            <div
              className={classNames("ml-4", "leading-tight", "flex flex-col")}
            >
              <span
                className={classNames("text-sm font-semibold text-gray-700")}
              >
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
    );
  }
);

export default FormCheckbox;
