import React, {
  FC,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";

import { useForm } from "react-hook-form";
import { QRCode } from "react-qr-svg";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { T, t } from "lib/i18n/react";
import { useTempleClient } from "lib/temple/front";

type FormData = {
  password: string;
};

const SyncSettings: FC = () => {
  const { generateSyncPayload } = useTempleClient();

  const { register, handleSubmit, errors, setError, clearError, formState } =
    useForm<FormData>();
  const submitting = formState.isSubmitting;

  const [payload, setPayload] = useState<string | null>(null);

  useEffect(() => {
    if (payload) {
      const t = setTimeout(() => {
        setPayload(null);
      }, 10 * 60_000);

      return () => {
        clearTimeout(t);
      };
    }
    return;
  }, [payload, setPayload]);

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  useLayoutEffect(() => {
    focusPasswordField();
  }, [focusPasswordField]);

  const onSubmit = useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        const syncPayload = await generateSyncPayload(password);
        setPayload(syncPayload);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", "submit-error", err.message);
        focusPasswordField();
      }
    },
    [
      submitting,
      clearError,
      setError,
      generateSyncPayload,
      setPayload,
      focusPasswordField,
    ]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      {payload ? (
        <>
          <Alert
            title={t("attentionExclamation")}
            description={<p>{`Attension text...`}</p>}
            className="my-4"
          />

          <QRCode
            value={payload}
            bgColor="#f7fafc"
            fgColor="#000000"
            level="Q"
            style={{ width: "100%" }}
            className="mb-8"
          />

          <FormField
            secret
            textarea
            rows={4}
            readOnly
            label={`Payload`}
            labelDescription={`Payload desc`}
            id="reveal-secret-secret"
            spellCheck={false}
            containerClassName="mb-4"
            className="resize-none notranslate"
            value={payload}
          />
        </>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: t("required") })}
            label={t("password")}
            labelDescription={`Password desc`}
            id="reveal-secret-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting}>
            <T id="sync" />
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
};

export default SyncSettings;
