import * as React from "react";
import { useForm } from "react-hook-form";
import { useThanosClient, useAccount } from "lib/thanos/front";
import AccountBanner from "app/templates/AccountBanner";
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
  const {
    revealPrivateKey,
    revealMnemonic,
    setSeedRevealed,
  } = useThanosClient();
  const account = useAccount();

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const [secret, setSecret] = React.useState<string | null>(null);

  const secretFieldRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (account.publicKeyHash) {
      return () => setSecret(null);
    }
  }, [account.publicKeyHash, setSecret]);

  React.useEffect(() => {
    if (secret) {
      secretFieldRef.current?.focus();
      secretFieldRef.current?.select();
    }
  }, [secret]);

  React.useEffect(() => {
    if (secret) {
      const t = setTimeout(() => {
        setSecret(null);
      }, 10 * 60_000);

      return () => {
        clearTimeout(t);
      };
    }
  }, [secret, setSecret]);

  const formRef = React.useRef<HTMLFormElement>(null);

  const focusPasswordField = React.useCallback(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  React.useLayoutEffect(() => {
    focusPasswordField();
  }, [focusPasswordField]);

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        let scrt: string;

        switch (reveal) {
          case "private-key":
            scrt = await revealPrivateKey(account.publicKeyHash, password);
            break;

          case "seed-phrase":
            scrt = await revealMnemonic(password);
            setSeedRevealed(true);
            break;
        }

        setSecret(scrt);
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
    [
      reveal,
      submitting,
      clearError,
      setError,
      revealPrivateKey,
      revealMnemonic,
      account.publicKeyHash,
      setSeedRevealed,
      setSecret,
      focusPasswordField,
    ]
  );

  const texts = React.useMemo(() => {
    switch (reveal) {
      case "private-key":
        return {
          name: "Private Key",
          accountBanner: (
            <AccountBanner
              account={account}
              labelDescription={
                <>
                  If you want to reveal from another - select it in the
                  top-level account dropdown.
                </>
              }
              className="mb-6"
            />
          ),
          attension: (
            <>
              <span className="font-semibold">DO NOT share</span> this set of
              chars with anyone! These string can be used to steal your current
              account.
            </>
          ),
          fieldDesc: (
            <>Current account key. Save it somewhere safe and secret.</>
          ),
        };

      case "seed-phrase":
        return {
          name: "Seed Phrase",
          accountBanner: null,
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
          ),
        };
    }
  }, [reveal, account]);

  return (
    <div className="w-full max-w-sm mx-auto p-2">
      {texts.accountBanner}

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
          />

          <Alert
            title="Attension!"
            description={<p>{texts.attension}</p>}
            className="my-4"
          />
        </>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription={`Enter password to reveal the ${texts.name}.`}
            id="reveal-secret-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting} disabled={submitting}>
            Reveal
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
};

export default RevealSecret;
