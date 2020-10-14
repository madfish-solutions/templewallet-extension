import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { validateMnemonic } from "bip39";
import { Link, navigate } from "lib/woozie";
import { T, useTranslation } from "lib/ui/i18n";
import {
  useThanosClient,
  useAllAccounts,
  useSetAccountPkh,
  validateDerivationPath,
} from "lib/thanos/front";
import { MNEMONIC_ERROR_CAPTION, formatMnemonic } from "app/defaults";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";

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
        i18nKey: "privateKey",
        Form: ByPrivateKeyForm,
      },
      {
        slug: "mnemonic",
        i18nKey: "mnemonic",
        Form: ByMnemonicForm,
      },
      {
        slug: "fundraiser",
        i18nKey: "fundraiser",
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
          <DownloadIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="importAccount">
            {(message) => <span className="capitalize">{message}</span>}
          </T>
        </>
      }
    >
      <div className="py-4">
        <div className="flex flex-wrap items-center justify-center mb-4">
          {allTabs.map((t) => {
            const active = slug === t.slug;

            return (
              <T key={t.slug} id={t.i18nKey}>
                {(message) => (
                  <Link
                    to={`/import-account/${t.slug}`}
                    replace
                    className={classNames(
                      "text-center cursor-pointer rounded-md mx-1 py-2 px-3",
                      "text-gray-600 text-sm",
                      active
                        ? "text-primary-orange bg-primary-orange bg-opacity-10"
                        : "hover:bg-gray-100 focus:bg-gray-100",
                      "transition ease-in-out duration-200"
                    )}
                  >
                    {message}
                  </Link>
                )}
              </T>
            );
          })}
        </div>

        <Form />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;

interface ByPrivateKeyFormData {
  privateKey: string;
  encPassword?: string;
}

const ByPrivateKeyForm: React.FC = () => {
  const { importAccount } = useThanosClient();
  const { t } = useTranslation();

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
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title={t("error")}
          autoFocus
          description={error}
          className="mb-6"
        />
      )}

      <FormField
        ref={register({ required: t("required") })}
        secret
        textarea
        rows={4}
        name="privateKey"
        id="importacc-privatekey"
        label={t("privateKey")}
        labelDescription={t("privateKeyInputDescription")}
        placeholder={t("privateKeyInputPlaceholder")}
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
              <T id="password" />{" "}
              <T id="optionalComment">
                {(message) => (
                  <span className="text-sm font-light text-gary-600">
                    {message}
                  </span>
                )}
              </T>
            </>
          }
          labelDescription={t("isPrivateKeyEncrypted")}
          placeholder="*********"
          errorCaption={errors.encPassword?.message}
          containerClassName="mb-6"
        />
      )}

      <FormSubmitButton loading={formState.isSubmitting}>
        {t("importAccount")}
      </FormSubmitButton>
    </form>
  );
};

const DERIVATION_PATHS = [
  {
    type: "none",
    i18nKey: "noDerivation",
  },
  {
    type: "custom",
    i18nKey: "customDerivationPath",
  },
];

interface ByMnemonicFormData {
  mnemonic: string;
  password?: string;
  customDerivationPath: string;
}

const ByMnemonicForm: React.FC = () => {
  const { importMnemonicAccount } = useThanosClient();
  const { t } = useTranslation();

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
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title={t("error")}
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
          required: t("required"),
          validate: (val) =>
            validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
        })}
        errorCaption={errors.mnemonic?.message}
        label={t("mnemonicInputLabel")}
        labelDescription={t("mnemonicInputDescription")}
        id="importfundacc-mnemonic"
        placeholder={t("mnemonicInputPlaceholder")}
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
            <T id="password" />{" "}
            <T id="optionalComment">
              {(message) => (
                <span className="text-sm font-light text-gary-600">
                  {message}
                </span>
              )}
            </T>
          </>
        }
        labelDescription={t("passwordInputDescription")}
        placeholder="*********"
        errorCaption={errors.password?.message}
        containerClassName="mb-6"
      />

      <div className={classNames("mb-4", "flex flex-col")}>
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <span className="text-base font-semibold text-gray-700">
            <T id="derivation" />{" "}
            <T id="optionalComment">
              {(message) => (
                <span className="text-sm font-light text-gary-600">
                  {message}
                </span>
              )}
            </T>
          </span>

          <T id="addDerivationPathPrompt">
            {(message) => (
              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                {message}
              </span>
            )}
          </T>
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
                    ? "bg-gray-300"
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
                <T id={dp.i18nKey} />
                <div className="flex-1" />
                {selected && (
                  <OkIcon
                    className={classNames("mx-2 h-4 w-auto stroke-2")}
                    style={{
                      stroke: "#777",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {derivationPath.type === "custom" && (
        <FormField
          ref={register({
            required: t("required"),
            validate: validateDerivationPath,
          })}
          name="customDerivationPath"
          id="importacc-cdp"
          label={t("customDerivationPath")}
          placeholder={t("derivationPathExample2")}
          errorCaption={
            errors.customDerivationPath?.message &&
            t(errors.customDerivationPath.message.toString())
          }
          containerClassName="mb-6"
        />
      )}

      <T id="importAccount">
        {(message) => (
          <FormSubmitButton loading={formState.isSubmitting} className="mt-8">
            {message}
          </FormSubmitButton>
        )}
      </T>
    </form>
  );
};

interface ByFundraiserFormData {
  email: string;
  password: string;
  mnemonic: string;
}

const ByFundraiserForm: React.FC = () => {
  const { t } = useTranslation();
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
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title={t("error")}
          description={error}
          autoFocus
          className="mb-6"
        />
      )}

      <FormField
        ref={register({ required: t("required") })}
        name="email"
        id="importfundacc-email"
        label={t("email")}
        placeholder="email@example.com"
        errorCaption={errors.email?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: t("required") })}
        name="password"
        type="password"
        id="importfundacc-password"
        label={t("password")}
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
          required: t("required"),
          validate: (val) =>
            validateMnemonic(formatMnemonic(val)) || MNEMONIC_ERROR_CAPTION,
        })}
        errorCaption={errors.mnemonic?.message}
        label={t("mnemonicInputLabel")}
        labelDescription={t("mnemonicInputDescription")}
        id="importfundacc-mnemonic"
        placeholder={t("mnemonicInputPlaceholder")}
        spellCheck={false}
        containerClassName="mb-6"
        className="resize-none"
      />

      <FormSubmitButton loading={formState.isSubmitting}>
        {t("importAccount")}
      </FormSubmitButton>
    </form>
  );
};
