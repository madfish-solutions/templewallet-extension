import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  ThanosToken,
  ThanosAssetType,
  useTokens,
  useAssets,
  useCurrentAsset,
  useTezos,
  isAddressValid,
  isKTAddress,
  loadContract,
  fetchBalance,
} from "lib/thanos/front";
import { getMessage, T, useTranslation } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as AddIcon } from "app/icons/add.svg";

const AddToken: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <AddIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id="addToken">{(message) => <>{message}</>}</T>
      </>
    }
  >
    <Form />
  </PageLayout>
);

export default AddToken;

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const TOKEN_TYPES = [
  {
    type: ThanosAssetType.FA1_2,
    name: "FA 1.2",
    comingSoon: false,
  },
  {
    type: ThanosAssetType.FA2,
    name: "FA 2",
    comingSoon: true,
  },
];

type FormData = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
};

const Form: React.FC = () => {
  const { addToken } = useTokens();
  const { allAssets } = useAssets();
  const { setAssetSymbol } = useCurrentAsset();
  const tezos = useTezos();
  const { t } = useTranslation();

  const prevAssetsLengthRef = React.useRef(allAssets.length);
  React.useEffect(() => {
    const assetsLength = allAssets.length;
    if (prevAssetsLengthRef.current < assetsLength) {
      setAssetSymbol(allAssets[assetsLength - 1].symbol);
      navigate("/");
    }
    prevAssetsLengthRef.current = assetsLength;
  }, [allAssets, setAssetSymbol]);

  const { register, handleSubmit, errors, formState } = useForm<FormData>({
    defaultValues: { decimals: 0 },
  });
  const [error, setError] = React.useState<React.ReactNode>(null);
  const [tokenType, setTokenType] = React.useState(TOKEN_TYPES[0]);

  const onSubmit = React.useCallback(
    async ({ address, symbol, name, decimals, iconUrl }: FormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        let contract;
        try {
          contract = await loadContract(tezos, address);
        } catch (_err) {
          throw new Error(t("contractNotAvailable"));
        }

        const token: ThanosToken = {
          type: tokenType.type as any,
          address,
          symbol,
          name,
          decimals: decimals || 0,
          iconUrl: iconUrl || undefined,
          fungible: true,
        };

        try {
          if (typeof contract.methods.transfer !== "function") {
            throw new Error(t("noTransferMethod"));
          }
          await fetchBalance(tezos, token, STUB_TEZOS_ADDRESS);
        } catch (_err) {
          throw new Error(t("tokenDoesNotMatchStandard"));
        }

        addToken(token);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [tokenType, formState.isSubmitting, tezos, addToken, setError, t]
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

      <div className={classNames("mb-6", "flex flex-col")}>
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <T id="tokenType">
            {(message) => (
              <span className="text-base font-semibold text-gray-700">
                {message}
              </span>
            )}
          </T>

          {/* <span
            className={classNames("mt-1", "text-xs font-light text-gray-600")}
            style={{ maxWidth: "90%" }}
          >
            By default derivation isn't used. Click on 'Custom derivation path'
            to add it.
          </span> */}
        </h2>

        <div
          className={classNames(
            "rounded-md overflow-hidden",
            "border-2 bg-gray-100",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {TOKEN_TYPES.map((tt, i, arr) => {
            const last = i === arr.length - 1;
            const selected = tokenType.type === tt.type;
            const handleClick = () => {
              setTokenType(tt);
            };

            return (
              <button
                key={tt.type}
                type="button"
                className={classNames(
                  "block w-full",
                  "overflow-hidden",
                  !last && "border-b border-gray-200",
                  selected
                    ? "bg-gray-300"
                    : "hover:bg-gray-200 focus:bg-gray-200",
                  "flex items-center",
                  "text-gray-700 font-medium",
                  "transition ease-in-out duration-200",
                  "focus:outline-none",
                  tt.comingSoon ? "opacity-50" : "opacity-90 hover:opacity-100"
                )}
                style={{
                  padding: "0.4rem 0.375rem 0.4rem 0.375rem",
                }}
                disabled={tt.comingSoon}
                onClick={!tt.comingSoon ? handleClick : undefined}
              >
                {tt.name}
                {tt.comingSoon && (
                  <T id="comingSoonComment">
                    {(message) => (
                      <span className="ml-1 text-xs font-light">{message}</span>
                    )}
                  </T>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <FormField
        ref={register({ required: t("required"), validate: validateAddress })}
        name="address"
        id="addtoken-address"
        label={t("address")}
        labelDescription={t("addressOfDeployedTokenContract")}
        placeholder={t("tokenContractPlaceholder")}
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          required: t("required"),
          pattern: {
            value: /^[a-zA-Z0-9]{2,7}$/,
            message: t("tokenSymbolPatternDescription"),
          },
        })}
        name="symbol"
        id="addtoken-symbol"
        label={t("symbol")}
        labelDescription={t("tokenSymbolInputDescription")}
        placeholder={t("tokenSymbolInputPlaceholder")}
        errorCaption={errors.symbol?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          required: t("required"),
          pattern: {
            value: /^[a-zA-Z0-9 _-]{3,12}$/,
            message: t("tokenNamePatternDescription"),
          },
        })}
        name="name"
        id="addtoken-name"
        label={t("name")}
        labelDescription={t("tokenNameInputDescription")}
        placeholder={t("tokenNameInputPlaceholder")}
        errorCaption={errors.name?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          min: { value: 0, message: t("nonNegativeIntMessage") },
        })}
        type="number"
        name="decimals"
        id="addtoken-decimals"
        label={t("decimals")}
        labelDescription={t("decimalsInputDescription")}
        placeholder="0"
        errorCaption={errors.decimals?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({
          pattern: {
            value: /(https:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i,
            message: (
              <ul className="list-disc list-inside">
                <T id="validImageURL">{(message) => <li>{message}</li>}</T>
                <T id="onlyHTTPS">{(message) => <li>{message}</li>}</T>
                <T id="formatsAllowed">{(message) => <li>{message}</li>}</T>
              </ul>
            ),
          },
        })}
        name="iconUrl"
        id="addtoken-iconUrl"
        label={
          <>
            <T id="iconURL">{(message) => <>{message}</>}</T>{" "}
            <T id="optionalComment">
              {(message) => (
                <span className="text-sm font-light text-gary-600">
                  {message}
                </span>
              )}
            </T>
          </>
        }
        labelDescription={t("iconURLInputDescription")}
        placeholder="e.g. https://cdn.com/mytoken.png"
        errorCaption={errors.iconUrl?.message}
        containerClassName="mb-6"
      />

      <T id="addToken">
        {(message) => (
          <FormSubmitButton loading={formState.isSubmitting}>
            {message}
          </FormSubmitButton>
        )}
      </T>
    </form>
  );
};

function validateAddress(value: any) {
  switch (false) {
    case isAddressValid(value):
      return getMessage("invalidAddress");

    case isKTAddress(value):
      return getMessage("onlyKTContractAddressAllowed");

    default:
      return true;
  }
}
