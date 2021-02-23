import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic, generateMnemonic } from "bip39";
import { Link } from "lib/woozie";
import { useTempleClient } from "lib/temple/front";
import { T, t } from "lib/i18n/react";
import { useAlert } from "lib/ui/dialog";
import {
  PASSWORD_PATTERN,
  PASSWORD_ERROR_CAPTION,
  MNEMONIC_ERROR_CAPTION,
  formatMnemonic,
} from "app/defaults";
import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormCheckbox from "app/atoms/FormCheckbox";
import FormSubmitButton from "app/atoms/FormSubmitButton";

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

const NewWallet: React.FC<NewWalletProps> = ({
  ownMnemonic = false,
  title,
}) => {
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

  React.useLayoutEffect(() => {
    if (formState.dirtyFields.has("repassword")) {
      triggerValidation("repassword");
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const [backupData, setBackupData] = React.useState<BackupData | null>(null);

  const onSubmit = React.useCallback(
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

  return (
    <div className="py-4">
      <h1
        className={classNames(
          "mb-2",
          "text-2xl font-light text-gray-700 text-center"
        )}
      >
        {backupData ? t("backupNewSeedPhrase") : title}
      </h1>

      <hr className="my-4" />

      {!backupData ? (
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
                  validateMnemonic(formatMnemonic(val)) ||
                  MNEMONIC_ERROR_CAPTION,
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

          <T id="create">
            {(message) => (
              <FormSubmitButton loading={submitting}>
                {message}
              </FormSubmitButton>
            )}
          </T>
        </form>
      ) : (
        <Backup data={backupData} />
      )}
    </div>
  );
};

export default NewWallet;

interface BackupFormData {
  backuped: boolean;
}

type BackupProps = {
  data: BackupData;
};

const Backup: React.FC<BackupProps> = ({ data }) => {
  const { registerWallet, setSeedRevealed } = useTempleClient();

  const {
    register,
    handleSubmit,
    errors,
    formState,
  } = useForm<BackupFormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(async () => {
    if (submitting) return;

    try {
      await registerWallet(data.password, data.mnemonic);
      setSeedRevealed(true);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      alert(err.message);
    }
  }, [
    submitting,
    registerWallet,
    setSeedRevealed,
    data.password,
    data.mnemonic,
  ]);

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <Alert
        title={""}
        description={
          <>
            <p>
              <T id="revealNewSeedPhrase" />
            </p>

            <p className="mt-1">
              <T id="doNotSharePhrase" />
            </p>
          </>
        }
        className="mt-4 mb-8"
      />

      <FormField
        secret
        textarea
        rows={4}
        readOnly
        label={t("mnemonicInputLabel")}
        labelDescription={t("youWillNeedThisSeedPhrase")}
        id="backup-mnemonic"
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none notranslate"
        value={data.mnemonic}
      />

      <form className="w-full mt-8" onSubmit={handleSubmit(onSubmit)}>
        <FormCheckbox
          ref={register({
            validate: (val) => val || t("unableToContinueWithoutConfirming"),
          })}
          errorCaption={errors.backuped?.message}
          name="backuped"
          label={t("backupedInputLabel")}
          labelDescription={<T id="backupedInputDescription" />}
          containerClassName="mb-6"
        />

        <T id="continue">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>
    </div>
  );
};
