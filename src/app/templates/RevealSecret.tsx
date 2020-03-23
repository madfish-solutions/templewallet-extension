import * as React from "react";
import { useForm } from "react-hook-form";
import { useThanosClient, useReadyThanos } from "lib/thanos/front";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";

const SUBMIT_ERROR_TYPE = "submit-error";

type FormData = {
  password: string;
};

type RevealSecretProps = {
  reveal: "private-key" | "seed-phrase";
};

const RevealSecret: React.FC<RevealSecretProps> = ({ reveal }) => {
  const { revealPrivateKey, revealMnemonic } = useThanosClient();
  const { accIndex } = useReadyThanos();

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const [secret, setSecret] = React.useState<string | null>(null);

  const secretFieldRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (secret) {
      secretFieldRef.current?.focus();
    }
  }, [secret]);

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        const scrt = await (() => {
          switch (reveal) {
            case "private-key":
              return revealPrivateKey(accIndex, password);

            case "seed-phrase":
              return revealMnemonic(password);
          }
        })();
        setSecret(scrt);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [
      reveal,
      submitting,
      clearError,
      setError,
      revealPrivateKey,
      revealMnemonic,
      accIndex,
      setSecret
    ]
  );

  const handleSecretFocus = React.useCallback(() => {
    secretFieldRef.current?.select();
  }, []);

  const handleSecretBlur = React.useCallback(() => {
    setSecret(null);
  }, [setSecret]);

  const texts = React.useMemo(() => {
    switch (reveal) {
      case "private-key":
        return {
          name: "Private Key",
          attension: (
            <>
              <span className="font-semibold">DO NOT share</span> this set of
              chars with anyone! These string can be used to steal your current
              account.
            </>
          ),
          fieldDesc: (
            <>Current account key. Save it somewhere safe and secret.</>
          )
        };

      case "seed-phrase":
        return {
          name: "Seed Phrase",
          attension: (
            <>
              <span className="font-semibold">DO NOT share</span> this phrase
              with anyone! These words can be used to steal all your accounts.
            </>
          ),
          fieldDesc: (
            <>
              If you ever change browsers or move computers, you will need this
              seed phrase to access your accounts. Save them somewhere safe and
              secret.
            </>
          )
        };
    }
  }, [reveal]);

  return (
    <div className="w-full max-w-sm mx-auto p-2">
      {secret ? (
        <>
          <FormField
            ref={secretFieldRef}
            secret
            textarea
            rows={4}
            readOnly
            label={texts.name}
            labelDescription={texts.fieldDesc}
            id="reveal-secret-secret"
            spellCheck={false}
            containerClassName="mb-4"
            className="resize-none notranslate"
            value={secret}
            onFocus={handleSecretFocus}
            onBlur={handleSecretBlur}
          />

          <Alert
            title="Attension!"
            description={<p>{texts.attension}</p>}
            className="my-4"
          />
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription={`Enter password to reveal ${texts.name}.`}
            id="reveal-secret-password"
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

export default RevealSecret;
