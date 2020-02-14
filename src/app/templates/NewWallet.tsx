import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
import {
  PASSWORD_PATTERN,
  PASSWORD_ERROR_CAPTION,
  MNEMONIC_ERROR_CAPTION
} from "app/defaults";
import FormField from "app/atoms/FormField";
import FormCheckbox from "app/atoms/FormCheckbox";

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

const NewWallet: React.FC<NewWalletProps> = ({ ownMnemonic, title }) => {
  const {
    watch,
    register,
    handleSubmit,
    errors,
    triggerValidation,
    formState
  } = useForm<FormData>();

  const passwordValue = watch("password");

  React.useLayoutEffect(() => {
    if (formState.dirtyFields.has("repassword")) {
      triggerValidation("repassword");
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const onSubmit = React.useCallback(data => {
    console.info(data);
  }, []);

  return (
    <div className="py-4">
      <h1 className="mb-2 text-2xl font-light text-gray-700 text-center">
        {title}
      </h1>
      <hr className="my-4" />

      <form
        className="my-8 w-full mx-auto max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        {ownMnemonic && (
          <FormField
            secret
            textarea
            rows={4}
            ref={register({
              required: true,
              validate: val => validateMnemonic(val)
            })}
            label="Seed phrase"
            labelDescription="Mnemonic. Your secret twelve word phrase."
            id="newwallet-mnemonic"
            name="mnemonic"
            placeholder="e.g. venue sock milk update..."
            spellCheck={false}
            errorCaption={errors.mnemonic && MNEMONIC_ERROR_CAPTION}
            containerClassName="mb-4"
            className="resize-none"
          />
        )}

        <FormField
          ref={register({ required: true, pattern: PASSWORD_PATTERN })}
          label="Password"
          labelDescription="A password is used to protect the wallet."
          id="newwallet-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password ? PASSWORD_ERROR_CAPTION : null}
          containerClassName="mb-4"
        />

        <FormField
          ref={register({
            required: true,
            validate: val => val === passwordValue
          })}
          label="Repeat Password"
          labelDescription="Please enter the password again."
          id="newwallet-repassword"
          type="password"
          name="repassword"
          placeholder="********"
          errorCaption={
            errors["repassword"] && "Required, must be equal to password above"
          }
          containerClassName="mb-6"
        />

        <FormCheckbox
          ref={register({ validate: Boolean })}
          errorCaption={
            errors["termsaccepted"] &&
            "Unable to continue without confirming Terms of Usage"
          }
          name="termsaccepted"
          label="Accept terms"
          labelDescription={
            <>
              I have read and agree to the{" "}
              <button type="button" className="text-secondary underline">
                Terms of Usage
              </button>
            </>
          }
          containerClassName="mb-6"
        />

        <button
          disabled={formState.isSubmitting}
          className={classNames(
            "px-8",
            "bg-primary-orange rounded",
            "flex items-center",
            "text-primary-orange-lighter text-shadow-black-orange",
            "text-base font-semibold",
            "transition duration-300 ease-in-out",
            "opacity-90 hover:opacity-100",
            "shadow-sm hover:shadow"
          )}
          style={{ paddingTop: "0.625rem", paddingBottom: "0.625rem" }}
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default NewWallet;
