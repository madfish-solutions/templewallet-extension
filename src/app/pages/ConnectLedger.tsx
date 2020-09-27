import { Controller, useForm } from "react-hook-form";
import React from "react";
import { ReactComponent as LinkIcon } from "app/icons/link.svg";
import PageLayout from "app/layouts/PageLayout";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormField from "app/atoms/FormField";
import AssetField from "app/atoms/AssetField";

type FormData = {
  name: string;
  accountIndex: number;
};

const ConnectLedger: React.FC = () => {
  const allLedgers = [];

  const defaultName = React.useMemo(() => `Ledger ${allLedgers.length + 1}`, [
    allLedgers.length,
  ]);

  const { control, register, handleSubmit, errors, formState } = useForm<
    FormData
  >({
    defaultValues: { name: defaultName, accountIndex: 0 },
  });
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback((formData: FormData) => {
    console.log("TODO: add ledger", formData);
  }, []);

  return (
    <PageLayout
      pageTitle={
        <>
          <LinkIcon className="w-auto h-4 mr-1 stroke-current" />
          Connect Ledger
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({
              pattern: {
                value: /^[a-zA-Z0-9 _-]{0,16}$/,
                message: "1-16 characters, no special",
              },
            })}
            label="Ledger name"
            labelDescription="What will be the name of the new ledger?"
            id="create-ledger-name"
            type="text"
            name="name"
            placeholder={defaultName}
            errorCaption={errors.name?.message}
            containerClassName="mb-4"
          />

          <Controller
            name="accountIndex"
            as={AssetField}
            control={control}
            onChange={([v]) => v}
            id="create-ledger-account-index"
            assetDecimals={0}
            min={0}
            label="HD Account Index"
            labelDescription="What is the last number in derivation path?"
            placeholder="0"
            errorCaption={errors.accountIndex?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting}>
            Create Account
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default ConnectLedger;
