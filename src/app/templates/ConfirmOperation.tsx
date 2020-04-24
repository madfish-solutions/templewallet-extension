import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import Logo from "app/atoms/Logo";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import { ReactComponent as ComponentIcon } from "app/icons/component.svg";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

type ConfirmOperationProps = {
  onConfirm: (password: string) => Promise<void>;
  onDecline: () => Promise<void>;
};

const ConfirmOperation: React.FC<ConfirmOperationProps> = ({
  onConfirm,
  onDecline,
}) => {
  const rootRef = React.useRef<HTMLFormElement>(null);

  const focusPasswordField = React.useCallback(() => {
    rootRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  React.useLayoutEffect(() => {
    const t = setTimeout(focusPasswordField, 100);
    return () => clearTimeout(t);
  }, [focusPasswordField]);

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        await onConfirm(password);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [submitting, clearError, setError, onConfirm, focusPasswordField]
  );

  const handleDeclineClick = React.useCallback(async () => {
    if (submitting) return;
    clearError("password");

    try {
      await onDecline();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      // Human delay.
      await new Promise((res) => setTimeout(res, 300));
      setError("password", SUBMIT_ERROR_TYPE, err.message);
      focusPasswordField();
    }
  }, [submitting, clearError, setError, onDecline, focusPasswordField]);

  return (
    <form
      ref={rootRef}
      className="flex flex-col items-center py-2"
      style={{
        height: 320,
        width: 320,
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-2 flex items-center">
        <Logo />

        <h1
          className={classNames(
            "ml-1",
            "text-2xl font-semibold tracking-tight",
            "text-gray-700"
          )}
        >
          Thanos
        </h1>
      </div>

      <SubTitle>Confirm operation</SubTitle>

      <FormField
        ref={register({ required: "Required" })}
        label="Password"
        labelDescription="Enter passwrod to confirm operation"
        id="unlock-password"
        type="password"
        name="password"
        placeholder="********"
        errorCaption={errors.password && errors.password.message}
      />

      <div className="flex-1" />

      <div className="w-full flex items-strech">
        <div className="w-1/2 pr-2">
          <FormSecondaryButton
            type="button"
            className="w-full justify-center"
            onClick={handleDeclineClick}
          >
            Decline
          </FormSecondaryButton>
        </div>

        <div className="w-1/2 pl-2">
          <FormSubmitButton
            className="w-full justify-center"
            loading={submitting}
            disabled={submitting}
          >
            Confirm
          </FormSubmitButton>
        </div>
      </div>
    </form>
  );
};

export default ConfirmOperation;

type SubTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const SubTitle: React.FC<SubTitleProps> = ({
  className,
  children,
  ...rest
}) => {
  const comp = (
    <span className="text-gray-500 px-1">
      <ComponentIcon className="h-5 w-auto stroke-current" />
    </span>
  );

  return (
    <h2
      className={classNames(
        "mb-6",
        "flex items-center justify-center",
        "text-gray-700",
        "text-lg",
        "font-light",
        "uppercase",
        className
      )}
      {...rest}
    >
      {comp}
      {children}
      {comp}
    </h2>
  );
};
