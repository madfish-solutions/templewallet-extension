import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  useThanosClient,
  useSetAccountPkh,
  useAllAccounts,
  ThanosAccountType,
} from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormField from "app/atoms/FormField";
import AssetField from "app/atoms/AssetField";
import { ReactComponent as LinkIcon } from "app/icons/link.svg";

type FormData = {
  name: string;
  hdIndex: number;
};

const ConnectLedger: React.FC = () => {
  const { createLedgerAccount } = useThanosClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();
  const allLedgers = React.useMemo(
    () => allAccounts.filter((acc) => acc.type === ThanosAccountType.Ledger),
    [allAccounts]
  );

  const defaultName = React.useMemo(() => `Ledger ${allLedgers.length + 1}`, [
    allLedgers.length,
  ]);

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const { control, register, handleSubmit, errors, formState } = useForm<
    FormData
  >({
    defaultValues: { name: defaultName, hdIndex: 0 },
  });
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async ({ name, hdIndex }: FormData) => {
      if (submitting) return;

      try {
        await createLedgerAccount(name, hdIndex);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        alert(err.message);
      }
    },
    [submitting, createLedgerAccount]
  );

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
            name="hdIndex"
            as={AssetField}
            control={control}
            onChange={([v]) => v}
            id="create-ledger-account-index"
            assetDecimals={0}
            min={0}
            label="HD Account Index"
            labelDescription="What is the last number in derivation path?"
            placeholder="0"
            errorCaption={errors.hdIndex?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting}>
            Add Ledger Account
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default ConnectLedger;
