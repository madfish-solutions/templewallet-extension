import * as React from "react";
import classNames from "clsx";
import { ThanosConfirmationPayload } from "lib/thanos/front";
import useSafeState from "lib/ui/useSafeState";
import Logo from "app/atoms/Logo";
import Alert from "app/atoms/Alert";
// import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import { ReactComponent as ComponentIcon } from "app/icons/component.svg";

type InternalConfiramtionProps = {
  payload: ThanosConfirmationPayload;
  onConfirm: (confirmed: boolean) => Promise<void>;
};

const InternalConfiramtion: React.FC<InternalConfiramtionProps> = ({
  payload,
  onConfirm,
}) => {
  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = React.useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed);
      } catch (err) {
        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError]
  );

  const handleConfirmClick = React.useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = React.useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  return (
    <div
      className="flex flex-col items-center py-2"
      style={{
        width: 320,
        height: 320,
      }}
    >
      <div className="mb-2 flex items-center">
        <Logo />

        <h1
          className={classNames(
            "ml-2",
            "text-2xl font-semibold tracking-tight",
            "text-gray-700"
          )}
        >
          Thanos
        </h1>
      </div>

      <SubTitle>Confirm operations</SubTitle>

      {payload.type === "operations" && (
        <>
          <h2
            className={classNames(
              "w-full mb-2",
              "text-base font-semibold leading-tight",
              "text-gray-700"
            )}
          >
            Operations
          </h2>

          <div
            className={classNames(
              "w-full max-w-full mb-4",
              "rounded-md overflow-auto",
              "border-2 bg-gray-100",
              "flex flex-col",
              "text-gray-700 text-sm leading-tight"
            )}
            style={{
              maxHeight: "8rem",
            }}
          >
            <pre>{JSON.stringify(payload.opParams, undefined, 2)}</pre>
          </div>
        </>
      )}

      {error && (
        <Alert
          type="error"
          title="Error"
          description={error?.message ?? "Something went wrong"}
          className="mb-6"
        />
      )}

      {/* <FormField
        ref={register({ required: "Required" })}
        label="Password"
        labelDescription="Enter password to confirm operation"
        id="unlock-password"
        type="password"
        name="password"
        placeholder="********"
        errorCaption={errors.password && errors.password.message}
      /> */}

      <div className="flex-1" />

      <div className="w-full flex items-stretch">
        <div className="w-1/2 pr-2">
          <FormSecondaryButton
            type="button"
            className="w-full justify-center"
            loading={declining}
            disabled={declining}
            onClick={handleDeclineClick}
          >
            Decline
          </FormSecondaryButton>
        </div>

        <div className="w-1/2 pl-2">
          <FormSubmitButton
            type="button"
            className="w-full justify-center"
            loading={confirming}
            disabled={confirming}
            onClick={handleConfirmClick}
          >
            Confirm
          </FormSubmitButton>
        </div>
      </div>
    </div>
  );
};

export default InternalConfiramtion;

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
