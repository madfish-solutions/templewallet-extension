import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
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

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      if (submitting) return;

      try {
        await registerWallet(
          data.password,
          ownMnemonic ? formatMnemonic(data.mnemonic!) : undefined
        );
        setSeedRevealed(ownMnemonic);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        alert(err.message);
      }
    },
    [submitting, ownMnemonic, registerWallet, setSeedRevealed]
  );

  return (
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

      <form
        className="my-8 w-full mx-auto max-w-sm"
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
                validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
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
              I have read and agree to the{" "}
              <a
                href="https://thanoswallet.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary underline"
              >
                Terms of Usage
              </a>
            </>
          }
          containerClassName="mb-6"
        />

        <FormSubmitButton loading={submitting} disabled={submitting}>
          Create
        </FormSubmitButton>
      </form>
    </div>
  );
};

export default NewWallet;
