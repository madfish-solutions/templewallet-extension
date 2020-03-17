import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
import { navigate } from "lib/woozie";
import { useThanosFront } from "lib/thanos/front";
import { MNEMONIC_ERROR_CAPTION } from "app/defaults";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";

type TABS = "privateKey" | "fundraiser";

const Tab: React.FC<{
  active: boolean;
  className?: string;
  onClick: () => void;
}> = ({ children, active, className, onClick }) => (
  <div
    className={classNames(
      "text-center cursor-pointer rounded-md mx-2 py-2 px-4",
      active
        ? "text-primary-orange bg-primary-orange-10"
        : "hover:bg-gray-100 focus:bg-gray-100",
      "transition ease-in-out duration-200",
      className
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

const ImportAccount: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TABS>("privateKey");

  const { accounts, setAccIndex } = useThanosFront();

  const prevAccLengthRef = React.useRef(accounts.length);
  React.useEffect(() => {
    const accLength = accounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccIndex(accLength - 1);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [accounts, setAccIndex]);

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
          <Tab
            onClick={() => setActiveTab("privateKey")}
            active={activeTab === "privateKey"}
          >
            Private Key
          </Tab>
          <Tab
            onClick={() => setActiveTab("fundraiser")}
            active={activeTab === "fundraiser"}
          >
            Fundraiser
          </Tab>
        </div>
        {activeTab === "privateKey" && <ImportPrivateKeyForm />}
        {activeTab === "fundraiser" && <ImportFundraiser />}
      </div>
    </PageLayout>
  );
};

interface FormDataPrivateKey {
  privateKey: string;
}

const ImportPrivateKeyForm: React.FC = () => {
  const { importAccount } = useThanosFront();

  const { register, handleSubmit, errors } = useForm<FormDataPrivateKey>();
  const [error, setError] = React.useState("");

  const onSubmit = React.useCallback<(data: FormDataPrivateKey) => void>(
    async data => {
      try {
        await importAccount(data.privateKey);
      } catch (err) {
        setError(err.message);
      }
    },
    [importAccount]
  );

  return (
    <form
      className="my-8 w-full mx-auto max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          title="Error"
          description={error}
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
        containerClassName="mb-6"
      />

      <FormSubmitButton>Import account</FormSubmitButton>
    </form>
  );
};

interface FormDataImportFundraiser {
  email: string;
  password: string;
  mnemonic: string;
}

const ImportFundraiser: React.FC = () => {
  const { importFundraiserAccount } = useThanosFront();
  const { register, errors, handleSubmit } = useForm<
    FormDataImportFundraiser
  >();
  const [error, setError] = React.useState("");

  const onSubmit = React.useCallback<(data: FormDataImportFundraiser) => void>(
    async data => {
      try {
        await importFundraiserAccount(data.email, data.password, data.mnemonic);
      } catch (err) {
        setError(err.message);
      }
    },
    [importFundraiserAccount]
  );

  return (
    <form
      className="my-8 w-full mx-auto max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          title="Error"
          description={error}
        />
      )}

      <FormField
        ref={register({ required: true })}
        name="email"
        id="importfundacc-email"
        label="Email"
        placeholder="email@gmail.com"
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
          validate: val => validateMnemonic(val)
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

      <FormSubmitButton>Import account</FormSubmitButton>
    </form>
  );
};

export default ImportAccount;
