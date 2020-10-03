import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import {
  useThanosClient,
  useAccount,
  ThanosAccountType,
} from "lib/thanos/front";
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
    return;
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
    return;
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
                  If you want to reveal a private key from another account - you
                  should select it in the top-right dropdown.
                </>
              }
              className="mb-6"
            />
          ),
          derivationPathBanner: null,
          attention: (
            <>
              <span className="font-semibold">DO NOT share</span> this set of
              chars with anyone! It can be used to steal your current account.
            </>
          ),
          fieldDesc: <>Current account key. Keep it secret.</>,
        };

      case "seed-phrase":
        return {
          name: "Seed Phrase",
          accountBanner: null,
          derivationPathBanner: (
            <div className={classNames("mb-6", "flex flex-col")}>
              <h2
                className={classNames("mb-4", "leading-tight", "flex flex-col")}
              >
                <span className="text-base font-semibold text-gray-700">
                  Derivation path
                </span>

                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  for HD acccounts. This is the thing you use to recover all
                  your accounts from your seed phrase.
                </span>
              </h2>

              <div
                className={classNames(
                  "w-full",
                  "border rounded-md",
                  "p-2",
                  "flex items-center"
                )}
              >
                <span className="text-sm font-medium text-gray-800">
                  {"m/44'/1729'/<account_index>'/0'"}
                </span>
              </div>
            </div>
          ),
          attention: (
            <>
              <span className="font-semibold">DO NOT share</span> this phrase
              with anyone! It can be used to steal all your accounts.
            </>
          ),
          fieldDesc: (
            <>
              If you ever switch between browsers or devices, you will need this
              seed phrase to access your accounts. Keep it secret.
            </>
          ),
        };
    }
  }, [reveal, account]);

  const forbidPrivateKeyRevealing =
    account.type === ThanosAccountType.Ledger && reveal === "private-key";

  const mainContent = React.useMemo(() => {
    if (forbidPrivateKeyRevealing) {
      return (
        <Alert
          title="Private key cannot be revealed"
          description={
            <p>
              You cannot get private key from{" "}
              <span
                className={classNames(
                  "rounded-sm",
                  "border",
                  "px-1 py-px",
                  "font-normal leading-tight"
                )}
                style={{ fontSize: "0.75em", borderColor: "currentColor" }}
              >
                Ledger
              </span>{" "}
              accounts.
            </p>
          }
          className="my-4"
        />
      );
    }

    if (secret) {
      return (
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
            title="Attention!"
            description={<p>{texts.attention}</p>}
            className="my-4"
          />
        </>
      );
    }

    return (
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

        <FormSubmitButton loading={submitting}>Reveal</FormSubmitButton>
      </form>
    );
  }, [
    forbidPrivateKeyRevealing,
    errors,
    handleSubmit,
    onSubmit,
    register,
    secret,
    texts,
    submitting,
  ]);

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      {texts.accountBanner}

      {texts.derivationPathBanner}

      {mainContent}
    </div>
  );
};

export default RevealSecret;
