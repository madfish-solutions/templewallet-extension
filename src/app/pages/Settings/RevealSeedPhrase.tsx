import * as React from "react";
import { useForm } from "react-hook-form";
import { useThanosFront } from "lib/thanos/front";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const RevealSeedPhrase: React.FC = () => {
  const { revealMnemonic } = useThanosFront();

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const [mnemonic, setMnemonic] = React.useState<string | null>(null);

  const mnemonicFieldRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (mnemonic) {
      mnemonicFieldRef.current?.focus();
    }
  }, [mnemonic]);

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        const m = await revealMnemonic(password);
        setMnemonic(m);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, revealMnemonic, setMnemonic]
  );

  const handleMnemonicFocus = React.useCallback(() => {
    mnemonicFieldRef.current?.select();
  }, []);

  const handleMnemonicBlur = React.useCallback(() => {
    setMnemonic(null);
  }, [setMnemonic]);

  return (
    <div className="w-full max-w-sm mx-auto p-2">
      {mnemonic ? (
        <>
          <FormField
            ref={mnemonicFieldRef}
            secret
            textarea
            rows={4}
            readOnly
            label="Seed phrase"
            labelDescription={
              <>
                If you ever change browsers or move computers, you will need
                this seed phrase to access your accounts. Save them somewhere
                safe and secret.
              </>
            }
            id="reveal-mnemonic-mnemonic"
            spellCheck={false}
            containerClassName="mb-4"
            className="resize-none notranslate"
            value={mnemonic}
            onFocus={handleMnemonicFocus}
            onBlur={handleMnemonicBlur}
          />

          <Alert
            title="Attension!"
            description={
              <>
                <p>
                  <span className="font-semibold">DO NOT share</span> this
                  phrase with anyone! These words can be used to steal all your
                  accounts.
                </p>
              </>
            }
            className="my-4"
          />
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription="Enter password to reveal Seed Phrase"
            id="reveal-mnemonic-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password && errors.password.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting}>Reveal</FormSubmitButton>
        </form>
      )}
    </div>
  );
};

export default RevealSeedPhrase;
