import * as React from "react";
import classNames from "clsx";
import { T } from "lib/i18n/react";
import CleanButton from "app/atoms/CleanButton";
import { ReactComponent as LockAltIcon } from "app/icons/lock-alt.svg";

type FormFieldRef = HTMLInputElement | HTMLTextAreaElement;
type FormFieldAttrs = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;
interface FormFieldProps extends FormFieldAttrs {
  extraSection?: React.ReactNode;
  label?: React.ReactNode;
  labelDescription?: React.ReactNode;
  errorCaption?: React.ReactNode;
  containerClassName?: string;
  textarea?: boolean;
  secret?: boolean;
  cleanable?: boolean;
  extraButton?: React.ReactNode;
  extraInner?: React.ReactNode;
  onClean?: () => void;
  fieldWrapperBottomMargin?: boolean;
  labelPaddingClassName?: string;
}

const FormField = React.forwardRef<FormFieldRef, FormFieldProps>(
  (
    {
      extraSection,
      label,
      labelDescription,
      errorCaption,
      containerClassName,
      textarea,
      secret: secretProp,
      cleanable,
      extraButton = null,
      extraInner = null,
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onClean,
      className,
      spellCheck = false,
      autoComplete = "off",
      fieldWrapperBottomMargin = true,
      labelPaddingClassName = "mb-4",
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? "textarea" : "input";

    const [localValue, setLocalValue] = React.useState(
      value ?? defaultValue ?? ""
    );
    const [focused, setFocused] = React.useState(false);

    const handleChange = React.useCallback(
      (evt) => {
        if (onChange) {
          onChange(evt);
          if (evt.defaultPrevented) {
            return;
          }
        }

        setLocalValue(evt.target.value);
      },
      [onChange, setLocalValue]
    );

    const handleFocus = React.useCallback(
      (evt) => {
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
      (evt) => {
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

    const getFieldEl = React.useCallback(() => {
      const selector = "input, textarea";
      return rootRef.current?.querySelector<HTMLFormElement>(selector);
    }, []);

    React.useEffect(() => {
      if (secret && focused) {
        const handleBlur = () => {
          getFieldEl()?.blur();
        };
        window.addEventListener("blur", handleBlur);
        return () => {
          window.removeEventListener("blur", handleBlur);
        };
      }
      return;
    }, [secret, focused, getFieldEl]);

    const secretBannerDisplayed = React.useMemo(
      () => Boolean(secret && localValue && !focused),
      [secret, localValue, focused]
    );

    const rootRef = React.useRef<HTMLDivElement>(null);

    const handleSecretBannerClick = React.useCallback(() => {
      getFieldEl()?.focus();
    }, [getFieldEl]);

    const handleCleanClick = React.useCallback(() => {
      if (onClean) {
        onClean();
      }
    }, [onClean]);

    return (
      <div
        ref={rootRef}
        className={classNames("w-full flex flex-col", containerClassName)}
      >
        {label ? (
          <label
            className={classNames(
              labelPaddingClassName,
              "leading-tight",
              "flex flex-col"
            )}
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

        {extraSection}

        <div
          className={classNames(
            "relative",
            fieldWrapperBottomMargin && "mb-2",
            "flex items-stretch"
          )}
        >
          <Field
            ref={ref as any}
            className={classNames(
              "appearance-none",
              "w-full",
              "py-3 pl-4",
              extraInner ? "pr-20" : "pr-4",
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
            value={value}
            defaultValue={defaultValue}
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
                "absolute inset-y-0 right-0 w-20",
                "flex items-center justify-end",
                "opacity-50",
                "pointer-events-none"
              )}
            >
              <span className="mx-4 text-lg font-light text-gray-900">
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
                left: 2,
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
                <T id="protectedFormField">
                  {(message) => <span>{message}</span>}
                </T>
              </p>

              <p
                className={classNames(
                  "mb-1",
                  "flex items-center",
                  "text-gray-500 text-sm"
                )}
              >
                <T id="clickToRevealOrEditField">
                  {(message) => <span>{message}</span>}
                </T>
              </p>
            </div>
          )}

          {cleanable && <CleanButton onClick={handleCleanClick} />}
        </div>

        {errorCaption ? (
          <div className="text-xs text-red-500">{errorCaption}</div>
        ) : null}
      </div>
    );
  }
);

export default FormField;
