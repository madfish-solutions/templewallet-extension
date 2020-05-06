import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
import { Link, navigate } from "lib/woozie";
import {
  useThanosClient,
  useAllAccounts,
  useSetAccountPkh,
} from "lib/thanos/front";
import { MNEMONIC_ERROR_CAPTION, formatMnemonic } from "app/defaults";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";

type ImportAccountProps = {
  tabSlug: string | null;
};

const ImportAccount: React.FC<ImportAccountProps> = ({ tabSlug }) => {
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

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
      {
        slug: "mnemonic",
        name: "Mnemonic",
        Form: ByMnemonicForm,
      },
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
        <div className="mb-4 flex flex-wrap items-center justify-center">
          {allTabs.map((t) => {
            const active = slug === t.slug;

            return (
              <Link
                key={t.slug}
                to={`/import-account/${t.slug}`}
                replace
                className={classNames(
                  "text-center cursor-pointer rounded-md mx-1 py-2 px-3",
                  "text-gray-600 text-sm",
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
  encPassword?: string;
}

const ByPrivateKeyForm: React.FC = () => {
  const { importAccount } = useThanosClient();

  const { register, handleSubmit, errors, formState, watch } = useForm<
    ByPrivateKeyFormData
  >();
  const [error, setError] = React.useState<React.ReactNode>(null);

  const onSubmit = React.useCallback(
    async ({ privateKey, encPassword }: ByPrivateKeyFormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importAccount(privateKey.replace(/\s/g, ""), encPassword);
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

  const keyValue = watch("privateKey");
  const encrypted = React.useMemo(() => keyValue?.substring(2, 3) === "e", [
    keyValue,
  ]);

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

      {encrypted && (
        <FormField
          ref={register}
          name="encPassword"
          type="password"
          id="importacc-password"
          label={
            <>
              Password{" "}
              <span className="text-sm font-light text-gary-600">
                (optional)
              </span>
            </>
          }
          labelDescription="Your private key in encrypted format?"
          placeholder="*********"
          errorCaption={errors.encPassword?.message}
          containerClassName="mb-6"
        />
      )}

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
      >
        Import account
      </FormSubmitButton>
    </form>
  );
};

const DERIVATION_PATHS = [
  {
    type: "none",
    name: "No derivation",
  },
  {
    type: "custom",
    name: "Custom derivation path",
  },
];

interface ByMnemonicFormData {
  mnemonic: string;
  password?: string;
  customDerivationPath: string;
}

const ByMnemonicForm: React.FC = () => {
  const { importMnemonicAccount } = useThanosClient();

  const { register, handleSubmit, errors, formState } = useForm<
    ByMnemonicFormData
  >({ defaultValues: { customDerivationPath: "m/44'/1729'/0'/0'" } });
  const [error, setError] = React.useState<React.ReactNode>(null);
  const [derivationPath, setDerivationPath] = React.useState(
    DERIVATION_PATHS[0]
  );

  const onSubmit = React.useCallback(
    async ({
      mnemonic,
      password,
      customDerivationPath,
    }: ByMnemonicFormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importMnemonicAccount(
          formatMnemonic(mnemonic),
          password || undefined,
          derivationPath.type === "custom" ? customDerivationPath : undefined
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
    [formState.isSubmitting, setError, importMnemonicAccount, derivationPath]
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
        secret
        textarea
        rows={4}
        name="mnemonic"
        ref={register({
          required: "Required",
          validate: (val) =>
            validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
        })}
        errorCaption={errors.mnemonic?.message}
        label="Seed phrase"
        labelDescription="Mnemonic. Your secret twelve word phrase."
        id="importfundacc-mnemonic"
        placeholder="e.g. venue sock milk update..."
        spellCheck={false}
        containerClassName="mb-4"
        className="resize-none"
      />

      <FormField
        ref={register}
        name="password"
        type="password"
        id="importfundacc-password"
        label={
          <>
            Password{" "}
            <span className="text-sm font-light text-gary-600">(optional)</span>
          </>
        }
        labelDescription="Used for additional mnemonic derivation. That is Not wallet password."
        placeholder="*********"
        errorCaption={errors.password?.message}
        containerClassName="mb-6"
      />

      <div className={classNames("mb-4", "flex flex-col")}>
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <span className="text-base font-semibold text-gray-700">
            Derivation{" "}
            <span className="text-sm font-light text-gary-600">(optional)</span>
          </span>

          <span
            className={classNames("mt-1", "text-xs font-light text-gray-600")}
            style={{ maxWidth: "90%" }}
          >
            By default derivation isn't used. Click on 'Custom derivation path'
            to add it.
          </span>
        </h2>

        <div
          className={classNames(
            "rounded-md overflow-hidden",
            "border-2 bg-gray-100",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {DERIVATION_PATHS.map((dp, i, arr) => {
            const last = i === arr.length - 1;
            const selected = derivationPath.type === dp.type;
            const handleClick = () => {
              setDerivationPath(dp);
            };

            return (
              <button
                key={dp.type}
                type="button"
                className={classNames(
                  "block w-full",
                  "overflow-hidden",
                  !last && "border-b border-gray-200",
                  selected
                    ? "bg-gray-200"
                    : "hover:bg-gray-200 focus:bg-gray-200",
                  "flex items-center",
                  "text-gray-700",
                  "transition ease-in-out duration-200",
                  "focus:outline-none",
                  "opacity-90 hover:opacity-100"
                )}
                style={{
                  padding: "0.4rem 0.375rem 0.4rem 0.375rem",
                }}
                onClick={handleClick}
              >
                {dp.name}
              </button>
            );
          })}
        </div>
      </div>

      {derivationPath.type === "custom" && (
        <FormField
          ref={register({
            required: "Required",
            validate: validateDerivationPath,
          })}
          name="customDerivationPath"
          id="importacc-cdp"
          label="Custom derivation path"
          placeholder="e.g. m/44'/1729'/..."
          errorCaption={errors.customDerivationPath?.message}
          containerClassName="mb-6"
        />
      )}

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
        className="mt-8"
      >
        Import account
      </FormSubmitButton>
    </form>
  );
};

function validateDerivationPath(p: string) {
  if (!p.startsWith("m")) {
    return "Must be start with 'm'";
  }
  if (p.length > 1 && p[1] !== "/") {
    return "Separator must be '/'";
  }

  const parts = p.replace("m", "").split("/").filter(Boolean);
  if (
    !parts.every((p) => {
      const pNum = +(p.includes("'") ? p.replace("'", "") : p);
      return Number.isSafeInteger(pNum) && pNum >= 0;
    })
  ) {
    return "Invalid path";
  }

  return true;
}

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
          formatMnemonic(data.mnemonic)
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
        ref={register({ required: "Required" })}
        name="email"
        id="importfundacc-email"
        label="Email"
        placeholder="email@example.com"
        errorCaption={errors.email?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: "Required" })}
        name="password"
        type="password"
        id="importfundacc-password"
        label="Password"
        placeholder="*********"
        errorCaption={errors.password?.message}
        containerClassName="mb-4"
      />

      <FormField
        secret
        textarea
        rows={4}
        name="mnemonic"
        ref={register({
          required: "Required",
          validate: (val) =>
            validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
        })}
        errorCaption={errors.mnemonic?.message}
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
