import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import classNames from "clsx";
import { useForm } from "react-hook-form";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { getAccountBadgeTitle } from "app/defaults";
import AccountBanner from "app/templates/AccountBanner";
import { T, t } from "lib/i18n/react";
import {
  useTempleClient,
  useAccount,
  TempleAccountType,
} from "lib/temple/front";

const SUBMIT_ERROR_TYPE = "submit-error";

type FormData = {
  password: string;
};

type RevealSecretProps = {
  reveal: "private-key" | "seed-phrase";
};

const RevealSecret: FC<RevealSecretProps> = ({ reveal }) => {
  const {
    revealPrivateKey,
    revealMnemonic,
    setSeedRevealed,
  } = useTempleClient();
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

  const [secret, setSecret] = useState<string | null>(null);

  const secretFieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (account.publicKeyHash) {
      return () => setSecret(null);
    }
    return;
  }, [account.publicKeyHash, setSecret]);

  useEffect(() => {
    if (secret) {
      secretFieldRef.current?.focus();
      secretFieldRef.current?.select();
    }
  }, [secret]);

  useEffect(() => {
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

  const texts = useMemo(() => {
    switch (reveal) {
      case "private-key":
        return {
          name: t("privateKey"),
          accountBanner: (
            <AccountBanner
              account={account}
              labelDescription={t(
                "ifYouWantToRevealPrivateKeyFromOtherAccount"
              )}
              className="mb-6"
            />
          ),
          derivationPathBanner: null,
          attention: <T id="doNotSharePrivateKey" />,
          fieldDesc: <T id="privateKeyFieldDescription" />,
        };

      case "seed-phrase":
        return {
          name: t("seedPhrase"),
          accountBanner: null,
          derivationPathBanner: (
            <div className={classNames("mb-6", "flex flex-col")}>
              <h2
                className={classNames("mb-4", "leading-tight", "flex flex-col")}
              >
                <T id="derivationPath">
                  {(message) => (
                    <span className="text-base font-semibold text-gray-700">
                      {message}
                    </span>
                  )}
                </T>

                <T id="pathForHDAccounts">
                  {(message) => (
                    <span
                      className={classNames(
                        "mt-1",
                        "text-xs font-light text-gray-600"
                      )}
                      style={{ maxWidth: "90%" }}
                    >
                      {message}
                    </span>
                  )}
                </T>
              </h2>

              <div
                className={classNames(
                  "w-full",
                  "border rounded-md",
                  "p-2",
                  "flex items-center"
                )}
              >
                <T id="derivationPathExample">
                  {(message) => (
                    <span className="text-sm font-medium text-gray-800">
                      {message}
                    </span>
                  )}
                </T>
              </div>
            </div>
          ),
          attention: <T id="doNotSharePhrase" />,
          fieldDesc: (
            <>
              <T id="youWillNeedThisSeedPhrase" />{" "}
              <T id="keepSeedPhraseSecret" />
            </>
          ),
        };
    }
  }, [reveal, account]);

  const forbidPrivateKeyRevealing =
    reveal === "private-key" &&
    [
      TempleAccountType.Ledger,
      TempleAccountType.ManagedKT,
      TempleAccountType.WatchOnly,
    ].includes(account.type);

  const mainContent = useMemo(() => {
    if (forbidPrivateKeyRevealing) {
      return (
        <Alert
          title={t("privateKeyCannotBeRevealed")}
          description={
            <p>
              <T
                id="youCannotGetPrivateKeyFromThisAccountType"
                substitutions={[
                  <span
                    key="account-type"
                    className={classNames(
                      "rounded-sm",
                      "border",
                      "px-1 py-px",
                      "font-normal leading-tight"
                    )}
                    style={{
                      fontSize: "0.75em",
                      borderColor: "currentColor",
                    }}
                  >
                    {getAccountBadgeTitle(account)}
                  </span>,
                ]}
              />
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
            title={t("attentionExclamation")}
            description={<p>{texts.attention}</p>}
            className="my-4"
          />
        </>
      );
    }

    return (
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t("required") })}
          label={t("password")}
          labelDescription={t(
            "revealSecretPasswordInputDescription",
            texts.name
          )}
          id="reveal-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-4"
        />

        <T id="reveal">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>
    );
  }, [
    account,
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
