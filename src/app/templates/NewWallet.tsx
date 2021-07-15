import React, {
  FC,
  ReactNode,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";

import { validateMnemonic, generateMnemonic } from "bip39";
import classNames from "clsx";
import { useForm } from "react-hook-form";

import Alert from "app/atoms/Alert";
import FormCheckbox from "app/atoms/FormCheckbox";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import {
  PASSWORD_PATTERN,
  PASSWORD_ERROR_CAPTION,
  MNEMONIC_ERROR_CAPTION,
  formatMnemonic,
} from "app/defaults";
import { T, t } from "lib/i18n/react";
import { useTempleClient } from "lib/temple/front";
import { useAlert } from "lib/ui/dialog";
import { Link } from "lib/woozie";

import Backup from "./NewWallet/Backup";
import Verify from "./NewWallet/Verify";

interface FormData {
  mnemonic?: string;
  password: string;
  repassword: string;
  termsaccepted: boolean;
}

interface BackupData {
  mnemonic: string;
  password: string;
}

type NewWalletProps = {
  ownMnemonic?: boolean;
  title: string;
};

const NewWallet: FC<NewWalletProps> = ({ ownMnemonic = false, title }) => {
  const { locked, registerWallet, setSeedRevealed } = useTempleClient();
  const alert = useAlert();

  const {
    watch,
    register,
    handleSubmit,
    errors,
    triggerValidation,
    formState,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const passwordValue = watch("password");

  useLayoutEffect(() => {
    if (formState.dirtyFields.has("repassword")) {
      triggerValidation("repassword");
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [verifySeedPhrase, setVerifySeedPhrase] = useState(false);

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;

      try {
        if (ownMnemonic) {
          await registerWallet(data.password, formatMnemonic(data.mnemonic!));
          setSeedRevealed(true);
        } else {
          setBackupData({
            mnemonic: generateMnemonic(128),
            password: data.password,
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        await alert({
          title: t("actionConfirmation"),
          children: err.message,
        });
      }
    },
    [
      submitting,
      ownMnemonic,
      setBackupData,
      registerWallet,
      setSeedRevealed,
      alert,
    ]
  );

  const handleBackupComplete = useCallback(() => {
    setVerifySeedPhrase(true);
  }, [setVerifySeedPhrase]);

  // Backup or Verify step
  if (backupData) {
    return verifySeedPhrase ? (
      // Verify step
      <Template title={t("verifySeedPhrase")}>
        <Verify data={backupData} />
      </Template>
    ) : (
      // Backup step
      <Template title={t("backupNewSeedPhrase")}>
        <Backup data={backupData} onBackupComplete={handleBackupComplete} />
      </Template>
    );
  }

  // Initial step (create or import mnemonic)
  return (
    <Template title={title}>
      <form
        className="w-full max-w-sm mx-auto my-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        {locked && (
          <Alert
            title={t("attentionExclamation")}
            description={
              <>
                <p>
                  <T id="lockedWalletAlreadyExists" />
                </p>

                <p className="mt-1">
                  <T
                    id="unlockWalletPrompt"
                    substitutions={[
                      <T id="backToUnlockPage" key="link">
                        {(linkLabel) => (
                          <Link
                            to="/"
                            className="font-semibold hover:underline"
                          >
                            {linkLabel}
                          </Link>
                        )}
                      </T>,
                    ]}
                  />
                </p>
              </>
            }
            className="my-6"
          />
        )}

        {ownMnemonic && (
          <FormField
            secret
            textarea
            rows={4}
            ref={register({
              required: t("required"),
              validate: (val) =>
                validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
            })}
            label={t("mnemonicInputLabel")}
            labelDescription={t("mnemonicInputDescription")}
            id="newwallet-mnemonic"
            name="mnemonic"
            placeholder={t("mnemonicInputPlaceholder")}
            spellCheck={false}
            errorCaption={errors.mnemonic?.message}
            containerClassName="mb-4"
            className="resize-none"
          />
        )}

        <FormField
          ref={register({
            required: t("required"),
            pattern: {
              value: PASSWORD_PATTERN,
              message: PASSWORD_ERROR_CAPTION,
            },
          })}
          label={t("password")}
          labelDescription={t("unlockPasswordInputDescription")}
          id="newwallet-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-4"
        />

        <FormField
          ref={register({
            required: t("required"),
            validate: (val) =>
              val === passwordValue || t("mustBeEqualToPasswordAbove"),
          })}
          label={t("repeatPassword")}
          labelDescription={t("repeatPasswordInputDescription")}
          id="newwallet-repassword"
          type="password"
          name="repassword"
          placeholder="********"
          errorCaption={errors.repassword?.message}
          containerClassName="mb-6"
        />

        <FormCheckbox
          ref={register({
            validate: (val) => val || t("confirmTermsError"),
          })}
          errorCaption={errors.termsaccepted?.message}
          name="termsaccepted"
          label={t("acceptTerms")}
          labelDescription={
            <T
              id="acceptTermsInputDescription"
              substitutions={[
                <T id="termsOfUsage" key="termsLink">
                  {(message) => (
                    <a
                      href="https://templewallet.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-secondary"
                    >
                      {message}
                    </a>
                  )}
                </T>,
                <T id="privacyPolicy" key="privacyPolicyLink">
                  {(message) => (
                    <a
                      href="https://templewallet.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-secondary"
                    >
                      {message}
                    </a>
                  )}
                </T>,
              ]}
            />
          }
          containerClassName="mb-6"
        />

        <FormSubmitButton loading={submitting}>
          <T id="create" />
        </FormSubmitButton>
      </form>
    </Template>
  );
};

export default NewWallet;

type TemplateProps = {
  title: ReactNode;
};

const Template: FC<TemplateProps> = ({ title, children }) => (
  <div className="py-4">
    <h1
      className={classNames(
        "mb-2",
        "text-2xl font-light text-gray-700 text-center"
      )}
    >
      {title}
    </h1>
    <hr className="my-4" />
    {children}
  </div>
);
