import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { IntercomClient } from "lib/intercom/client";
import { ThanosConfirmRequest, ThanosMessageType } from "lib/thanos/types";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const intercom = new IntercomClient();

const Confirm: React.FC = () => {
  const id = React.useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id")!;
  }, []);

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        const req: ThanosConfirmRequest = {
          type: ThanosMessageType.ConfirmRequest,
          id,
          confirm: true,
          password
        };
        await intercom.request(req);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, id]
  );

  const handleDeclineClick = React.useCallback(async () => {
    if (submitting) return;
    clearError("password");

    try {
      const req: ThanosConfirmRequest = {
        type: ThanosMessageType.ConfirmRequest,
        id,
        confirm: false
      };
      await intercom.request(req);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      // Human delay.
      await new Promise(res => setTimeout(res, 300));
      setError("password", SUBMIT_ERROR_TYPE, err.message);
    }
  }, [submitting, clearError, setError, id]);

  return (
    <div className={classNames("w-full h-screen", "overflow-y-auto")}>
      <form
        className="my-8 w-full mx-auto max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormField
          ref={register({ required: "Required" })}
          label="Password"
          labelDescription="Enter passwrod to confirm operation"
          id="unlock-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password && errors.password.message}
          containerClassName="mb-4"
          autoFocus
        />

        <div className="flex items-center justify-end">
          <FormSecondaryButton
            type="button"
            className="mr-4"
            onClick={handleDeclineClick}
          >
            Decline
          </FormSecondaryButton>

          <FormSubmitButton loading={submitting} disabled={submitting}>
            Confirm
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
};

export default Confirm;
