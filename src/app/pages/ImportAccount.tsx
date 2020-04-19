import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
import { Link, navigate } from "lib/woozie";
import { useThanosClient, useReadyThanos } from "lib/thanos/front";
import { MNEMONIC_ERROR_CAPTION } from "app/defaults";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";

type ImportAccountProps = {
  tabSlug: string | null;
};

const ImportAccount: React.FC<ImportAccountProps> = ({ tabSlug }) => {
  const { allAccounts, setAccountPkh } = useReadyThanos();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const allTabs = React.useMemo(
    () => [
      {
        slug: "private-key",
        name: "Private Key",
        Form: ByPrivateKeyForm,
      },
      // {
      //   slug: "mnemonic",
      //   name: "Mnemonic",
      //   Form: () => null,
      // },
      {
        slug: "fundraiser",
        name: "Fundraiser",
        Form: ByFundraiserForm,
      },
    ],
    []
  );
  const { slug, Form } = React.useMemo(() => {
    const tab = tabSlug ? allTabs.find((t) => t.slug === tabSlug) : null;
    return tab ?? allTabs[0];
  }, [allTabs, tabSlug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <DownloadIcon className="mr-1 h-4 w-auto stroke-current" />
          Import Account
        </>
      }
    >
      <div className="py-4">
        <div className="flex text-gray-600 text-base font-light justify-center mb-4">
          {allTabs.map((t) => {
            const active = slug === t.slug;

            return (
              <Link
                key={t.slug}
                to={`/import-account/${t.slug}`}
                replace
                className={classNames(
                  "text-center cursor-pointer rounded-md mx-2 py-2 px-4",
                  active
                    ? "text-primary-orange bg-primary-orange-10"
                    : "hover:bg-gray-100 focus:bg-gray-100",
                  "transition ease-in-out duration-200"
                )}
              >
                {t.name}
              </Link>
            );
          })}
        </div>

        <Form />
      </div>
    </PageLayout>
  );
};

interface ByPrivateKeyFormData {
  privateKey: string;
}

const ByPrivateKeyForm: React.FC = () => {
  const { importAccount } = useThanosClient();

  const { register, handleSubmit, errors, formState } = useForm<
    ByPrivateKeyFormData
  >();
  const [error, setError] = React.useState<React.ReactNode>(null);

  const onSubmit = React.useCallback<(data: ByPrivateKeyFormData) => void>(
    async (data) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importAccount(data.privateKey.replace(/\s/g, ""));
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [importAccount, formState.isSubmitting, setError]
  );

  return (
    <form
      className="my-8 w-full mx-auto max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title="Error"
          autoFocus
          description={error}
          className="mb-6"
        />
      )}

      <FormField
        ref={register({ required: "Required" })}
        secret
        textarea
        rows={4}
        name="privateKey"
        id="importacc-privatekey"
        label="Private Key"
        labelDescription="The Secret key of the Account you want to import."
        placeholder="e.g. edsk3wfiPMu..."
        errorCaption={errors.privateKey?.message}
        className="resize-none"
        containerClassName="mb-6"
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
      >
        Import account
      </FormSubmitButton>
    </form>
  );
};

interface ByFundraiserFormData {
  email: string;
  password: string;
  mnemonic: string;
}

const ByFundraiserForm: React.FC = () => {
  const { importFundraiserAccount } = useThanosClient();
  const { register, errors, handleSubmit, formState } = useForm<
    ByFundraiserFormData
  >();
  const [error, setError] = React.useState<React.ReactNode>(null);

  const onSubmit = React.useCallback<(data: ByFundraiserFormData) => void>(
    async (data) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importFundraiserAccount(
          data.email,
          data.password,
          data.mnemonic.trim()
        );
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [importFundraiserAccount, formState.isSubmitting, setError]
  );

  return (
    <form
      className="my-8 w-full mx-auto max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title="Error"
          description={error}
          autoFocus
          className="mb-6"
        />
      )}

      <FormField
        ref={register({ required: true })}
        name="email"
        id="importfundacc-email"
        label="Email"
        placeholder="email@example.com"
        errorCaption={errors.email ? "Required" : null}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: true })}
        name="password"
        type="password"
        id="importfundacc-password"
        label="Password"
        placeholder="*********"
        errorCaption={errors.password ? "Required" : null}
        containerClassName="mb-4"
      />

      <FormField
        secret
        textarea
        rows={4}
        name="mnemonic"
        ref={register({
          required: true,
          validate: (val) => validateMnemonic(val.trim()),
        })}
        errorCaption={errors.mnemonic && MNEMONIC_ERROR_CAPTION}
        label="Seed phrase"
        labelDescription="Mnemonic. Your secret twelve word phrase."
        id="importfundacc-mnemonic"
        placeholder="e.g. venue sock milk update..."
        spellCheck={false}
        containerClassName="mb-6"
        className="resize-none"
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
      >
        Import account
      </FormSubmitButton>
    </form>
  );
};

export default ImportAccount;
