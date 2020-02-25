import * as React from "react";
import { useForm } from "react-hook-form";
import { useThanosFront } from "lib/thanos/front";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const RevealMnemonic: React.FC = () => {
  const { revealMnemonic } = useThanosFront();

  const [mnemonic, setMnemonic] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const mnemonicFieldRef = React.useRef<HTMLTextAreaElement>(null);

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

  const handleMnemonicBlur = React.useCallback(() => {
    setMnemonic(null);
  }, [setMnemonic]);

  const handleMnemonicFocus = React.useCallback(() => {
    mnemonicFieldRef.current?.select();
  }, []);

  React.useEffect(() => {
    if (mnemonic) {
      mnemonicFieldRef.current?.focus();
    }
  }, [mnemonic]);

  return (
    <div className="max-w-sm p-2">
      {mnemonic ? (
        <FormField
          ref={mnemonicFieldRef}
          secret
          textarea
          rows={4}
          readOnly
          label="Seed phrase"
          labelDescription="Mnemonic. Your secret twelve word phrase."
          id="reveal-mnemonic-mnemonic"
          spellCheck={false}
          containerClassName="mb-4"
          className="resize-none notranslate"
          value={mnemonic}
          onFocus={handleMnemonicFocus}
          onBlur={handleMnemonicBlur}
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription="A password is used to protect the wallet."
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

export default RevealMnemonic;
