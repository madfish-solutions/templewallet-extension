import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic, generateMnemonic } from "bip39";
import { Link } from "lib/woozie";
import { useThanosClient } from "lib/thanos/front";
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
        {backupData ? "Backup new Seed Phrase" : title}
      </h1>

      <hr className="my-4" />

      {!backupData ? (
        <form
          className="w-full max-w-sm mx-auto my-8"
          onSubmit={handleSubmit(onSubmit)}
        >
          {locked && (
            <Alert
              title="Attension!"
              description={
                <>
                  <p>
                    Locked wallet{" "}
                    <span className="font-semibold">already exist</span>
                    .
                    <br />
                    Importing a new one will{" "}
                    <span className="font-semibold">destroy the existing</span>.
                  </p>
                  <p className="mt-1">
                    If you want to save something from already existing wallet -{" "}
                    <Link to="/" className="font-semibold hover:underline">
                      back to Unlock page
                    </Link>{" "}
                    and unlock it.
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
                required: "Required",
                validate: (val) =>
                  validateMnemonic(formatMnemonic(val)) ||
                  MNEMONIC_ERROR_CAPTION,
              })}
              label="Seed phrase"
              labelDescription="Mnemonic. Your secret twelve word phrase."
              id="newwallet-mnemonic"
              name="mnemonic"
              placeholder="e.g. venue sock milk update..."
              spellCheck={false}
              errorCaption={errors.mnemonic?.message}
              containerClassName="mb-4"
              className="resize-none"
            />
          )}

          <FormField
            ref={register({
              required: "Required",
              pattern: {
                value: PASSWORD_PATTERN,
                message: PASSWORD_ERROR_CAPTION,
              },
            })}
            label="Password"
            labelDescription="A password is used to protect the wallet."
            id="newwallet-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <FormField
            ref={register({
              required: "Required",
              validate: (val) =>
                val === passwordValue || "Must be equal to password above",
            })}
            label="Repeat Password"
            labelDescription="Please enter the password again."
            id="newwallet-repassword"
            type="password"
            name="repassword"
            placeholder="********"
            errorCaption={errors.repassword?.message}
            containerClassName="mb-6"
          />

          <FormCheckbox
            ref={register({
              validate: (val) =>
                val || "Unable to continue without confirming Terms of Usage",
            })}
            errorCaption={errors.termsaccepted?.message}
            name="termsaccepted"
            label="Accept terms"
            labelDescription={
              <>
                I have read and agree to
                <br />
                the{" "}
                <a
                  href="https://thanoswallet.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  Terms of Usage
                </a>{" "}
                and{" "}
                <a
                  href="https://thanoswallet.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-secondary"
                >
                  Privacy Policy
                </a>
              </>
            }
            containerClassName="mb-6"
          />

          <FormSubmitButton loading={submitting}>Create</FormSubmitButton>
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
              <span className="font-semibold">Click on area below</span> to
              reveal your new Seed Phrase.
              <br />
              Then, write this phrase on a piece of paper and{" "}
              <span className="font-semibold">store in a secure location</span>.
              Or you can memorize it.
            </p>

            <p>
              <span className="font-semibold">DO NOT share</span> this phrase
              with anyone! It can be used to steal all your accounts.
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
        label="Seed Phrase"
        labelDescription={
          <>
            If you ever switch between browsers or devices, you will need this
            seed phrase to access your accounts.
          </>
        }
        id="backup-mnemonic"
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none notranslate"
        value={data.mnemonic}
      />

      <form className="w-full mt-8" onSubmit={handleSubmit(onSubmit)}>
        <FormCheckbox
          ref={register({
            validate: (val) => val || "Unable to continue without confirming ",
          })}
          errorCaption={errors.backuped?.message}
          name="backuped"
          label="I made Seed Phrase backup"
          labelDescription={
            <>
              And accept the risks that if I lose the phrase,
              <br />
              my funds may be lost.
            </>
          }
          containerClassName="mb-6"
        />

        <FormSubmitButton loading={submitting}>Continue</FormSubmitButton>
      </form>
    </div>
  );
};
