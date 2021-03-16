import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import { validateMnemonic } from "bip39";
import { Link, navigate } from "lib/woozie";
import { T, t } from "lib/i18n/react";
import {
  useTempleClient,
  useSetAccountPkh,
  validateDerivationPath,
  useTezos,
  ActivationStatus,
  useAllAccounts,
  isAddressValid,
  isDomainNameValid,
  useTezosDomainsClient,
  isKTAddress,
  confirmOperation,
  useNetwork,
} from "lib/temple/front";
import useSafeState from "lib/ui/useSafeState";
import { MNEMONIC_ERROR_CAPTION, formatMnemonic } from "app/defaults";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import NoSpaceField from "app/atoms/NoSpaceField";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import ManagedKTForm from "app/templates/ManagedKTForm";

type ImportAccountProps = {
  tabSlug: string | null;
};

type ImportTabDescriptor = {
  slug: string;
  i18nKey: string;
  Form: React.FC<{}>;
};

const ImportAccount: React.FC<ImportAccountProps> = ({ tabSlug }) => {
  const network = useNetwork();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  const prevNetworkRef = React.useRef(network);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const allTabs = React.useMemo(
    () =>
      [
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
        network.type !== "main"
          ? {
              slug: "faucet",
              i18nKey: "faucetFileTitle",
              Form: FromFaucetForm,
            }
          : undefined,
        {
          slug: "managed-kt",
          i18nKey: "managedKTAccount",
          Form: ManagedKTForm,
        },
        {
          slug: "watch-only",
          i18nKey: "watchOnlyAccount",
          Form: WatchOnlyForm,
        },
      ].filter((x): x is ImportTabDescriptor => !!x),
    [network.type]
  );
  const { slug, Form } = React.useMemo(() => {
    const tab = tabSlug ? allTabs.find((t) => t.slug === tabSlug) : null;
    return tab ?? allTabs[0];
  }, [allTabs, tabSlug]);
  React.useEffect(() => {
    const prevNetworkType = prevNetworkRef.current.type;
    prevNetworkRef.current = network;
    if (
      prevNetworkType !== "main" &&
      network.type === "main" &&
      slug === "faucet"
    ) {
      navigate(`/import-account/private-key`);
    }
  }, [network, slug]);

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
        <div
          className={classNames(
            "w-full max-w-md mx-auto",
            "mb-4",
            "flex flex-wrap items-center justify-center"
          )}
        >
          {allTabs.map((t) => {
            const active = slug === t.slug;

            return (
              <T key={t.slug} id={t.i18nKey}>
                {(message) => (
                  <Link
                    to={`/import-account/${t.slug}`}
                    replace
                    className={classNames(
                      "text-center cursor-pointer rounded-md mx-1 py-2 px-3 mb-1",
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
  const { importAccount } = useTempleClient();

  const {
    register,
    handleSubmit,
    errors,
    formState,
    watch,
  } = useForm<ByPrivateKeyFormData>();
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
                  <span className="text-sm font-light text-gray-600">
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
    type: "default",
    i18nKey: "defaultAccount",
  },
  {
    type: "another",
    i18nKey: "anotherAccount",
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
  accountNumber?: number;
}

const ByMnemonicForm: React.FC = () => {
  const { importMnemonicAccount } = useTempleClient();

  const {
    register,
    handleSubmit,
    errors,
    formState,
  } = useForm<ByMnemonicFormData>({
    defaultValues: {
      customDerivationPath: "m/44'/1729'/0'/0'",
      accountNumber: 1,
    },
  });
  const [error, setError] = React.useState<React.ReactNode>(null);
  const [derivationPath, setDerivationPath] = React.useState(
    DERIVATION_PATHS[0]
  );

  const onSubmit = React.useCallback(
    async ({
      mnemonic,
      password,
      customDerivationPath,
      accountNumber,
    }: ByMnemonicFormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        await importMnemonicAccount(
          formatMnemonic(mnemonic),
          password || undefined,
          (() => {
            switch (derivationPath.type) {
              case "custom":
                return customDerivationPath;
              case "default":
                return "m/44'/1729'/0'/0'";
              case "another":
                return `m/44'/1729'/${accountNumber! - 1}'/0'`;
              default:
                return undefined;
            }
          })()
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
                <span className="text-sm font-light text-gray-600">
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
                <span className="text-sm font-light text-gray-600">
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

      {derivationPath.type === "another" && (
        <FormField
          ref={register({
            min: { value: 1, message: t("positiveIntMessage") },
            required: t("required"),
          })}
          min={0}
          type="number"
          name="accountNumber"
          id="importacc-acc-number"
          label={t("accountNumber")}
          placeholder="1"
          errorCaption={errors.accountNumber?.message}
        />
      )}

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
          errorCaption={errors.customDerivationPath?.message}
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
  const { importFundraiserAccount } = useTempleClient();
  const {
    register,
    errors,
    handleSubmit,
    formState,
  } = useForm<ByFundraiserFormData>();
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

interface FaucetData {
  mnemonic: string[];
  secret: string;
  amount: string;
  pkh: string;
  password: string;
  email: string;
}

interface FaucetTextInputFormData {
  text: string;
}

const FromFaucetForm: React.FC = () => {
  const { importFundraiserAccount } = useTempleClient();
  const setAccountPkh = useSetAccountPkh();
  const tezos = useTezos();

  const activateAccount = React.useCallback(
    async (address: string, secret: string) => {
      let op;
      try {
        op = await tezos.tz.activate(address, secret);
      } catch (err) {
        const invalidActivationError =
          err && err.body && /Invalid activation/.test(err.body);
        if (invalidActivationError) {
          return [ActivationStatus.AlreadyActivated] as [ActivationStatus];
        }

        throw err;
      }

      return [ActivationStatus.ActivationRequestSent, op] as [
        ActivationStatus,
        typeof op
      ];
    },
    [tezos]
  );

  const {
    control,
    handleSubmit: handleTextFormSubmit,
    watch,
    errors,
    setValue,
  } = useForm<FaucetTextInputFormData>();
  const textFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [processing, setProcessing] = useSafeState(false);
  const [alert, setAlert] = useSafeState<React.ReactNode | Error>(null);
  const textFieldValue = watch("text");

  const handleTextFieldFocus = React.useCallback(
    () => textFieldRef.current?.focus(),
    []
  );
  const cleanTextField = React.useCallback(() => setValue("text", ""), [
    setValue,
  ]);

  const handleFormSubmit = React.useCallback((evt) => {
    evt.preventDefault();
  }, []);

  const importAccount = React.useCallback(
    async (data: FaucetData) => {
      const [activationStatus, op] = await activateAccount(
        data.pkh,
        data.secret
      );

      if (activationStatus === ActivationStatus.ActivationRequestSent) {
        setAlert(`🛫 ${t("requestSent", t("activationOperationType"))}`);
        await confirmOperation(tezos, op!.hash);
      }

      try {
        await importFundraiserAccount(
          data.email,
          data.password,
          data.mnemonic.join(" ")
        );
      } catch (err) {
        if (/Account already exists/.test(err?.message)) {
          setAccountPkh(data.pkh);
          navigate("/");
          return;
        }

        throw err;
      }
    },
    [activateAccount, importFundraiserAccount, setAccountPkh, setAlert, tezos]
  );

  const onTextFormSubmit = React.useCallback(
    async (formData: FaucetTextInputFormData) => {
      if (processing) {
        return;
      }
      setProcessing(true);
      setAlert(null);

      try {
        await importAccount(toFaucetJSON(formData.text));
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));

        setAlert(err);
      } finally {
        setProcessing(false);
      }
    },
    [importAccount, processing, setAlert, setProcessing]
  );

  const handleUploadChange = React.useCallback(
    async (evt) => {
      if (processing) return;
      setProcessing(true);
      setAlert(null);

      try {
        let data: FaucetData;
        try {
          data = await new Promise((res, rej) => {
            const reader = new FileReader();

            reader.onerror = () => {
              rej();
              reader.abort();
            };

            reader.onload = (readEvt: any) => {
              try {
                res(toFaucetJSON(readEvt.target.result));
              } catch (err) {
                rej(err);
              }
            };

            reader.readAsText(evt.target.files[0]);
          });
        } catch (_err) {
          throw new Error(t("unexpectedOrInvalidFile"));
        }

        await importAccount(data);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));

        setAlert(err);
      } finally {
        formRef.current?.reset();
        setProcessing(false);
      }
    },
    [importAccount, processing, setAlert, setProcessing]
  );

  return (
    <>
      <form
        ref={formRef}
        className="w-full max-w-sm mx-auto mt-8"
        onSubmit={handleFormSubmit}
      >
        {alert && (
          <Alert
            type={alert instanceof Error ? "error" : "success"}
            title={alert instanceof Error ? t("error") : t("success")}
            description={
              alert instanceof Error
                ? alert?.message ?? t("smthWentWrong")
                : alert
            }
            className="mb-6"
          />
        )}

        <div className="flex flex-col w-full">
          <label
            className={classNames("mb-4", "leading-tight", "flex flex-col")}
          >
            <span className="text-base font-semibold text-gray-700">
              <T id="faucetFile" />
            </span>

            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              <T
                id="faucetFileInputPrompt"
                substitutions={[
                  <a
                    href="https://faucet.tzalpha.net/"
                    key="link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal underline"
                  >
                    https://faucet.tzalpha.net
                  </a>,
                ]}
              />
            </span>
          </label>

          <div className="relative w-full mb-2">
            <input
              className={classNames(
                "appearance-none",
                "absolute inset-0 w-full",
                "block py-2 px-4",
                "opacity-0",
                "cursor-pointer"
              )}
              type="file"
              name="documents[]"
              accept=".json,application/json"
              disabled={processing}
              onChange={handleUploadChange}
            />

            <div
              className={classNames(
                "w-full",
                "px-4 py-6",
                "border-2 border-dashed",
                "border-gray-300",
                "focus:border-primary-orange",
                "bg-gray-100 focus:bg-transparent",
                "focus:outline-none focus:shadow-outline",
                "transition ease-in-out duration-200",
                "rounded-md",
                "text-gray-400 text-lg leading-tight",
                "placeholder-alphagray"
              )}
            >
              <svg
                width={48}
                height={48}
                viewBox="0 0 24 24"
                aria-labelledby="uploadIconTitle"
                stroke="#e2e8f0"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                color="#e2e8f0"
                className="m-4 mx-auto"
              >
                <title>{"Upload"}</title>
                <path d="M12 4v13M7 8l5-5 5 5M20 21H4" />
              </svg>
              <div className="w-full text-center">
                {processing ? (
                  <T id="processing" />
                ) : (
                  <T
                    id="selectFileOfFormat"
                    substitutions={[<b key="format">JSON</b>]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      <form
        className="w-full max-w-sm mx-auto my-8"
        onSubmit={handleTextFormSubmit(onTextFormSubmit)}
      >
        <Controller
          name="text"
          as={<FormField className="font-mono" ref={textFieldRef} />}
          control={control}
          rules={{
            validate: validateFaucetTextInput,
          }}
          onChange={([v]) => v}
          onFocus={handleTextFieldFocus}
          textarea
          rows={5}
          cleanable={Boolean(textFieldValue)}
          onClean={cleanTextField}
          id="faucet-text-input"
          label={t("faucetJson")}
          labelDescription={t("faucetJsonDescription")}
          placeholder={"{ ... }"}
          errorCaption={
            errors.text?.message && t(errors.text?.message.toString())
          }
          className="text-xs"
          style={{
            resize: "none",
          }}
          containerClassName="mb-4"
        />
        <div className="w-full flex">
          <FormSubmitButton loading={processing}>
            <T id="submit" />
          </FormSubmitButton>
        </div>
      </form>
    </>
  );
};

function validateFaucetTextInput(text?: string) {
  if (!text) {
    return "required";
  }
  try {
    toFaucetJSON(text);
    return true;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return "invalidJsonInput";
    }
    return "notFaucetJson";
  }
}

function toFaucetJSON(text: string) {
  const data = JSON.parse(text);
  if (
    ![data.pkh, data.secret, data.mnemonic, data.email, data.password].every(
      Boolean
    )
  ) {
    throw new Error();
  }
  return data;
}

interface WatchOnlyFormData {
  address: string;
}

const WatchOnlyForm: React.FC = () => {
  const { importWatchOnlyAccount } = useTempleClient();
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();
  const canUseDomainNames = domainsClient.isSupported;

  const {
    watch,
    handleSubmit,
    errors,
    control,
    formState,
    setValue,
    triggerValidation,
  } = useForm<WatchOnlyFormData>({ mode: "onChange" });
  const [error, setError] = React.useState<React.ReactNode>(null);

  const addressFieldRef = React.useRef<HTMLTextAreaElement>(null);

  const addressValue = watch("address");

  const domainAddressFactory = React.useCallback(
    (_k: string, _checksum: string, addressValue: string) =>
      domainsClient.resolver.resolveNameToAddress(addressValue),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(
    ["tzdns-address", tezos.checksum, addressValue],
    domainAddressFactory,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const finalAddress = React.useMemo(() => resolvedAddress || addressValue, [
    resolvedAddress,
    addressValue,
  ]);

  const cleanToField = React.useCallback(() => {
    setValue("to", "");
    triggerValidation("to");
  }, [setValue, triggerValidation]);

  const validateAddressField = React.useCallback(
    async (value: any) => {
      if (!value?.length || value.length < 0) {
        return false;
      }

      if (!canUseDomainNames) {
        return validateAddress(value);
      }

      if (isDomainNameValid(value, domainsClient)) {
        const resolved = await domainsClient.resolver.resolveNameToAddress(
          value
        );
        if (!resolved) {
          return t("domainDoesntResolveToAddress", value);
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : t("invalidAddressOrDomain");
    },
    [canUseDomainNames, domainsClient]
  );

  const onSubmit = React.useCallback(async () => {
    if (formState.isSubmitting) return;

    setError(null);
    try {
      if (!isAddressValid(finalAddress)) {
        throw new Error(t("invalidAddress"));
      }

      let chainId: string | undefined;

      if (isKTAddress(finalAddress)) {
        try {
          await tezos.contract.at(finalAddress);
        } catch {
          throw new Error(t("contractNotExistOnNetwork"));
        }

        chainId = await tezos.rpc.getChainId();
      }

      await importWatchOnlyAccount(finalAddress, chainId);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      // Human delay
      await new Promise((r) => setTimeout(r, 300));
      setError(err.message);
    }
  }, [
    importWatchOnlyAccount,
    finalAddress,
    tezos,
    formState.isSubmitting,
    setError,
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
          description={error}
          autoFocus
          className="mb-6"
        />
      )}

      <Controller
        name="address"
        as={<NoSpaceField ref={addressFieldRef} />}
        control={control}
        rules={{
          required: "Required",
          validate: validateAddressField,
        }}
        onChange={([v]) => v}
        onFocus={() => addressFieldRef.current?.focus()}
        textarea
        rows={2}
        cleanable={Boolean(addressValue)}
        onClean={cleanToField}
        id="send-to"
        label={t("address")}
        labelDescription={
          <T
            id={
              canUseDomainNames
                ? "addressInputDescriptionWithDomain"
                : "addressInputDescription"
            }
          />
        }
        placeholder={t(
          canUseDomainNames
            ? "recipientInputPlaceholderWithDomain"
            : "recipientInputPlaceholder"
        )}
        errorCaption={errors.address?.message}
        style={{
          resize: "none",
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && (
        <div
          className={classNames(
            "mb-4 -mt-3",
            "text-xs font-light text-gray-600",
            "flex flex-wrap items-center"
          )}
        >
          <span className="mr-1 whitespace-no-wrap">
            {t("resolvedAddress")}:
          </span>
          <span className="font-normal">{resolvedAddress}</span>
        </div>
      )}

      <FormSubmitButton loading={formState.isSubmitting}>
        {t("importAccount")}
      </FormSubmitButton>
    </form>
  );
};

function validateAddress(value: any) {
  switch (false) {
    case value?.length > 0:
      return true;

    case isAddressValid(value):
      return "invalidAddress";

    default:
      return true;
  }
}
