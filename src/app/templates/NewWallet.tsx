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
import FileInput from "app/atoms/FileInput";
import FormCheckbox from "app/atoms/FormCheckbox";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import TabSwitcher from "app/atoms/TabSwitcher";
import {
  PASSWORD_PATTERN,
  PASSWORD_ERROR_CAPTION,
  MNEMONIC_ERROR_CAPTION,
  formatMnemonic,
} from "app/defaults";
import { ReactComponent as TrashbinIcon } from "app/icons/bin.svg";
import { ReactComponent as PaperclipIcon } from "app/icons/paperclip.svg";
import { T, t } from "lib/i18n/react";
import { decryptKukaiSeedPhrase, useTempleClient } from "lib/temple/front";
import { useAlert } from "lib/ui/dialog";
import { Link } from "lib/woozie";

import Backup from "./NewWallet/Backup";
import Verify from "./NewWallet/Verify";

interface FormData {
  keystoreFile?: FileList;
  keystorePassword?: string;
  shouldUseKeystorePassword?: boolean;
  mnemonic?: string;
  password?: string;
  repassword?: string;
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

const importWalletOptions = ["Seed phrase", "Keystore file"];

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
    setValue,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const shouldUseKeystorePassword = watch("shouldUseKeystorePassword");
  const passwordValue = watch("password");
  const keystoreFileList = watch("keystoreFile");
  const keystoreFile = keystoreFileList?.item(0);

  useLayoutEffect(() => {
    if (formState.dirtyFields.has("repassword")) {
      triggerValidation("repassword");
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [verifySeedPhrase, setVerifySeedPhrase] = useState(false);

  const clearKeystoreFileInput = useCallback(
    (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      e.stopPropagation();
      // @ts-ignore
      setValue("keystoreFile", []);
    },
    [setValue]
  );

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;

      try {
        if (ownMnemonic) {
          if (activeTabIndex === 0) {
            await registerWallet(
              data.password!,
              formatMnemonic(data.mnemonic!)
            );
            setSeedRevealed(true);
          } else {
            try {
              const mnemonic = await decryptKukaiSeedPhrase(
                await data.keystoreFile!.item(0)!.text(),
                data.keystorePassword!
              );
              await registerWallet(
                data.shouldUseKeystorePassword
                  ? data.keystorePassword!
                  : data.password!,
                mnemonic
              );
              setSeedRevealed(true);
            } catch (e) {
              alert({
                title: t("errorImportingKukaiWallet"),
                children:
                  e instanceof SyntaxError
                    ? t("fileHasSyntaxError")
                    : e.message,
              });
            }
          }
        } else {
          setBackupData({
            mnemonic: generateMnemonic(128),
            password: data.password!,
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
      activeTabIndex,
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
      {ownMnemonic && (
        <>
          <TabSwitcher
            className="mt-4"
            tabsLabels={importWalletOptions}
            activeTabIndex={activeTabIndex}
            onTabSelect={setActiveTabIndex}
          />
          <div className="h-4" />
        </>
      )}
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

        {ownMnemonic && activeTabIndex === 0 && (
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

        {ownMnemonic && activeTabIndex === 1 && (
          <>
            <label className={classNames("mb-4 leading-tight flex flex-col")}>
              <span className="text-base font-semibold text-gray-700">
                <T id="file" />
              </span>

              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                <T id="keystoreFileFieldDescription" />
              </span>
            </label>

            <div className="w-full mb-10">
              <FileInput
                name="keystoreFile"
                multiple={false}
                accept=".tez"
                ref={register({
                  required: t("required"),
                })}
              >
                <div
                  className={classNames(
                    "w-full px-4 py-10 flex flex-col items-center",
                    "border-2 border-dashed border-gray-400 rounded-md",
                    "focus:border-primary-orange",
                    "transition ease-in-out duration-200",
                    "text-gray-400 text-lg leading-tight",
                    "placeholder-alphagray"
                  )}
                >
                  <div className="flex flex-row justify-center items-center mb-10">
                    <span className="text-lg leading-tight text-gray-600">
                      {keystoreFile?.name ?? t("fileInputPrompt")}
                    </span>
                    {keystoreFile ? (
                      <TrashbinIcon
                        className="ml-2 w-6 h-auto text-red-700 stroke-current z-10 cursor-pointer"
                        onClick={clearKeystoreFileInput}
                      />
                    ) : (
                      <PaperclipIcon className="ml-2 w-6 h-auto text-gray-600 stroke-current" />
                    )}
                  </div>
                  <div className="w-40 py-3 rounded bg-blue-600 shadow-sm text-center font-semibold text-sm text-white">
                    {t("selectFile")}
                  </div>
                </div>
              </FileInput>
              {errors.keystoreFile && (
                <div className="text-xs text-red-500 mt-1">
                  {errors.keystoreFile.message}
                </div>
              )}
            </div>

            <FormField
              ref={register({
                required: t("required"),
              })}
              label={t("filePassword")}
              labelDescription={t("filePasswordInputDescription")}
              id="keystore-password"
              type="password"
              name="keystorePassword"
              placeholder="********"
              errorCaption={errors.password?.message}
              containerClassName="mb-8"
            />

            <FormCheckbox
              ref={register()}
              name="shouldUseKeystorePassword"
              label={t("useKeystorePassword")}
              containerClassName={shouldUseKeystorePassword ? "mb-2" : "mb-8"}
            />
          </>
        )}

        {(!ownMnemonic ||
          activeTabIndex === 0 ||
          !shouldUseKeystorePassword) && (
          <>
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
              containerClassName="mb-8"
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
              containerClassName="mb-8"
            />
          </>
        )}

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
          containerClassName="mb-8"
        />

        <FormSubmitButton
          loading={submitting}
          className={ownMnemonic ? "w-full flex justify-center" : undefined}
        >
          <T id={ownMnemonic ? "import" : "create"} />
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
