import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic, generateMnemonic } from "bip39";
import { Link } from "lib/woozie";
import { useThanosClient } from "lib/thanos/front";
import { T, useTranslation } from "lib/ui/i18n";
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
  const { locked, registerWallet, setSeedRevealed } = useThanosClient();
  const { t } = useTranslation();

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

        alert(err.message);
      }
    },
    [submitting, ownMnemonic, setBackupData, registerWallet, setSeedRevealed]
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
              title={t("attentionExclamation") as string}
              description={
                <>
                  <p>
                    <T name="lockedWallet">{(message) => <>{message}</>}</T>{" "}
                    <T name="alreadyExistsWallet">
                      {(message) => (
                        <span className="font-semibold">{message}</span>
                      )}
                    </T>
                    .
                    <br />
                    <T name="importingNewWalletWill">
                      {(message) => <>{message}</>}
                    </T>{" "}
                    <T name="willDestroyTheExisting">
                      {(message) => (
                        <span className="font-semibold">{message}</span>
                      )}
                    </T>
                    .
                  </p>
                  <T
                    name="unlockWalletPrompt"
                    substitutions={[
                      <T name="backToUnlockPage" key="link">
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
                  >
                    {(message) => <p className="mt-1">{message}</p>}
                  </T>
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
                required: t("required") as string,
                validate: (val) =>
                  validateMnemonic(formatMnemonic(val)) ||
                  MNEMONIC_ERROR_CAPTION,
              })}
              label={t("mnemonicInputLabel")}
              labelDescription={t("mnemonicInputDescription")}
              id="newwallet-mnemonic"
              name="mnemonic"
              placeholder={t("mnemonicInputPlaceholder") as string}
              spellCheck={false}
              errorCaption={errors.mnemonic?.message}
              containerClassName="mb-4"
              className="resize-none"
            />
          )}

          <FormField
            ref={register({
              required: t("required") as string,
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
              required: t("required") as string,
              validate: (val) =>
                val === passwordValue ||
                (t("mustBeEqualToPasswordAbove") as string),
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
              <>
                <T
                  name="acceptTermsInputDescription"
                  substitutions={[
                    <T name="termsOfUsage" key="termsLink">
                      {(message) => (
                        <a
                          href="https://thanoswallet.com/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-secondary"
                        >
                          {message}
                        </a>
                      )}
                    </T>,
                    <T name="privacyPolicy" key="privacyPolicyLink">
                      {(message) => (
                        <a
                          href="https://thanoswallet.com/privacy"
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
              </>
            }
            containerClassName="mb-6"
          />

          <T name="create">
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
  const { t } = useTranslation();
  const { registerWallet, setSeedRevealed } = useThanosClient();

  const { register, handleSubmit, errors, formState } = useForm<
    BackupFormData
  >();
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
            <p className="mb-2">
              <T name="clickOnAreaBelow">
                {(message) => <span className="font-semibold">{message}</span>}
              </T>
              <T name="toRevealNewSeedPhrase">{(message) => <>{message}</>}</T>
              <br />
              <T name="writePhraseOnPieceOfPaper">
                {(message) => <>{message}</>}
              </T>{" "}
              <T name="storePhraseInSecureLocation">
                {(message) => <span className="font-semibold">{message}</span>}
              </T>
              .
              <T name="orYouCanMemorizePhrase">{(message) => <>{message}</>}</T>
            </p>

            <T
              name="doNotSharePhrase"
              substitutions={[
                <T key="doNotShare" name="doNotShareEmphasized">
                  {(message) => (
                    <span className="font-semibold">{message}</span>
                  )}
                </T>,
              ]}
            >
              {(message) => <p>{message}</p>}
            </T>
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
          labelDescription={
            <T name="backupedInputDescription">
              {(message) => {
                const [phrasePart1, phrasePart2] = (message as string).split(
                  "\n"
                );

                return (
                  <>
                    {phrasePart1}
                    <br />
                    {phrasePart2}
                  </>
                );
              }}
            </T>
          }
          containerClassName="mb-6"
        />

        <T name="continue">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>
    </div>
  );
};
