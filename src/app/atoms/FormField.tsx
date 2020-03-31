import * as React from "react";
import classNames from "clsx";
import { ReactComponent as LockAltIcon } from "app/icons/lock-alt.svg";

type FormFieldRef = HTMLInputElement | HTMLTextAreaElement;
type FormFieldAttrs = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;
interface FormFieldProps extends FormFieldAttrs {
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
  errorCaption?: React.ReactNode;
  containerClassName?: string;
  textarea?: boolean;
  secret?: boolean;
  extraButton?: React.ReactNode;
  extraInner?: React.ReactNode;
}

const FormField = React.forwardRef<FormFieldRef, FormFieldProps>(
  (
    {
      label,
      labelDescription,
      errorCaption,
      containerClassName,
      textarea,
      secret: secretProp,
      extraButton = null,
      extraInner = null,
      id,
      onChange,
      onFocus,
      onBlur,
      className,
      spellCheck = false,
      autoComplete = "off",
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? "textarea" : "input";

    const [value, setValue] = React.useState("");
    const [focused, setFocused] = React.useState(false);

    const handleChange = React.useCallback(
      evt => {
        if (onChange) {
          onChange(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setValue(evt.target.value);
      },
      [onChange, setValue]
    );

    const handleFocus = React.useCallback(
      evt => {
        if (onFocus) {
          onFocus(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setFocused(true);
      },
      [onFocus, setFocused]
    );

    const handleBlur = React.useCallback(
      evt => {
        if (onBlur) {
          onBlur(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setFocused(false);
      },
      [onBlur, setFocused]
    );

    const secretBannerDisplayed = React.useMemo(
      () => Boolean(secret && value && !focused),
      [secret, value, focused]
    );

    const rootRef = React.useRef<HTMLDivElement>(null);

    const handleSecretBannerClick = React.useCallback(() => {
      const selector = "input, textarea";
      const el = rootRef.current?.querySelector<HTMLFormElement>(selector);
      el?.focus();
    }, []);

    return (
      <div
        ref={rootRef}
        className={classNames("w-full flex flex-col", containerClassName)}
      >
        {label ? (
          <label
            className={classNames("mb-4", "leading-tight", "flex flex-col")}
            htmlFor={id}
          >
            <span className="text-base font-semibold text-gray-700">
              {label}
            </span>

            {labelDescription && (
              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                {labelDescription}
              </span>
            )}
          </label>
        ) : null}

        <div className={classNames("relative", "mb-2", "flex items-stretch")}>
          <Field
            ref={ref as any}
            className={classNames(
              "appearance-none",
              "w-full",
              "py-3 pl-4",
              extraInner ? "pr-16" : "pr-4",
              "border-2",
              errorCaption ? "border-red-500" : "border-gray-300",
              "focus:border-primary-orange",
              "bg-gray-100 focus:bg-transparent",
              "focus:outline-none focus:shadow-outline",
              "transition ease-in-out duration-200",
              "rounded-md",
              "text-gray-700 text-lg leading-tight",
              "placeholder-alphagray",
              className
            )}
            id={id}
            spellCheck={spellCheck}
            autoComplete={autoComplete}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {extraInner && (
            <div
              className={classNames(
                "overflow-hidden",
                "absolute inset-y-0 right-0 w-16",
                "flex items-center justify-center",
                "opacity-50",
                "pointer-events-none"
              )}
            >
              <span className="text-gray-900 text-lg font-light">
                {extraInner}
              </span>
            </div>
          )}

          {extraButton}

          {secretBannerDisplayed && (
            <div
              className={classNames(
                "absolute",
                "bg-gray-200",
                "rounded-md",
                "flex flex-col items-center justify-center",
                "cursor-text"
              )}
              style={{
                top: 2,
                right: 2,
                bottom: 2,
                left: 2
              }}
              onClick={handleSecretBannerClick}
            >
              <p
                className={classNames(
                  "mb-1",
                  "flex items-center",
                  "text-gray-600 text-lg font-semibold",
                  "uppercase",
                  "text-shadow-black"
                )}
              >
                <LockAltIcon
                  className={classNames(
                    "-ml-2 mr-1",
                    "h-6 w-auto",
                    "stroke-current stroke-2"
                  )}
                />
                <span>Protected</span>
              </p>

              <p
                className={classNames(
                  "mb-1",
                  "flex items-center",
                  "text-gray-500 text-sm"
                )}
              >
                <span>Click to reveal or edit this field</span>
              </p>
            </div>
          )}
        </div>
        {errorCaption ? (
          <div className="text-xs text-red-500">{errorCaption}</div>
        ) : null}
      </div>
    );
  }
);

export default FormField;
