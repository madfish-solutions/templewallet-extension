import {
  MetadataParseError,
  getTokenMetadata,
  InvalidRpcIdError,
  InvalidNetworkNameError,
  InvalidContractAddressError,
  ContractNotFoundError,
  FetchURLError,
} from "@thanos-wallet/tokens";
import { WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import * as React from "react";
import classNames from "clsx";
import { FormContextValues, useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  ThanosAssetType,
  useTokens,
  useCurrentAsset,
  useTezos,
  loadContract,
  validateContractAddress,
  useNetwork,
  assertFA12Token,
} from "lib/thanos/front";
import { T, t } from "lib/i18n/react";
import useSafeState from "lib/ui/useSafeState";
import { withErrorHumanDelay } from "lib/ui/humanDelay";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import NoSpaceField from "app/atoms/NoSpaceField";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { URL_PATTERN } from "app/defaults";

const INCLUDES_URL_PATTERN = new RegExp(
  URL_PATTERN.source.substring(1, URL_PATTERN.source.length - 1)
);

const AddToken: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <AddIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id="addToken" />
      </>
    }
  >
    <Form />
  </PageLayout>
);

export default AddToken;

const TOKEN_TYPES = [
  {
    type: ThanosAssetType.FA1_2 as const,
    name: "FA 1.2",
    comingSoon: false,
  },
  {
    type: ThanosAssetType.FA2 as const,
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
  const { setAssetSymbol } = useCurrentAsset();
  const tezos = useTezos();
  const { id: networkId } = useNetwork();

  const {
    register,
    handleSubmit,
    errors,
    formState,
    watch,
    setValue,
    triggerValidation,
  } = useForm<FormData>({
    defaultValues: { decimals: 0 },
  });
  const contractAddress = watch("address");
  const [submitError, setSubmitError] = React.useState<React.ReactNode>(null);
  const [tokenDataError, setTokenDataError] = React.useState<React.ReactNode>(
    null
  );
  const [tokenValidationError, setTokenValidationError] = React.useState<
    React.ReactNode
  >(null);
  const [tokenType, setTokenType] = React.useState(TOKEN_TYPES[0]);
  const [bottomSectionVisible, setBottomSectionVisible] = useSafeState(false);
  const [loadingToken, setLoadingToken] = React.useState(false);

  React.useEffect(() => {
    setBottomSectionVisible(false);
    if (validateContractAddress(contractAddress) !== true) {
      return;
    }
    triggerValidation("address");
    (async () => {
      try {
        setTokenDataError(null);
        setTokenValidationError(null);
        setSubmitError(null);
        setLoadingToken(true);

        let contract: WalletContract;
        try {
          contract = await loadContract(tezos, contractAddress, false);
        } catch (_err) {
          throw new TokenValidationError(t("contractNotAvailable"));
        }

        try {
          await assertFA12Token(contract, tezos);
        } catch (_err) {
          throw new TokenValidationError(t("tokenDoesNotMatchStandard"));
        }

        const tokenData =
          (await getTokenMetadata(tezos, contractAddress, networkId)) || {};
        const { symbol, name, description, decimals, onetoken } = tokenData;
        const tokenSymbol = typeof symbol === "string" ? symbol : "";
        const tokenName =
          (typeof name === "string" && name) ||
          (typeof description === "string" && description) ||
          "";
        const tokenDecimals =
          (decimals instanceof BigNumber && decimals.toNumber()) ||
          (onetoken instanceof BigNumber &&
            Math.round(Math.log10(onetoken.toNumber()))) ||
          0;

        setValue([
          { symbol: tokenSymbol.substr(0, 5) },
          { name: tokenName.substr(0, 50) },
          { decimals: tokenDecimals },
        ]);
        setBottomSectionVisible(true);
      } catch (e) {
        withErrorHumanDelay(e, () => {
          if (e instanceof TokenValidationError) {
            setTokenValidationError(e.message);
            return;
          }
          let errorMessage = e.message;
          if (e instanceof MetadataParseError) {
            if (e instanceof InvalidContractAddressError) {
              errorMessage = (
                <T
                  id="referredByTokenContactAddressInvalid"
                  substitutions={e.payload.contractAddress}
                />
              );
            } else if (e instanceof InvalidNetworkNameError) {
              errorMessage = (
                <T
                  id="someNetworkIsNotCurrent"
                  substitutions={e.payload.name}
                />
              );
            } else if (e instanceof InvalidRpcIdError) {
              errorMessage = (
                <T
                  id="someNetworkWithChainIdIsNotCurrent"
                  substitutions={e.payload.chainId}
                />
              );
            } else if (e instanceof ContractNotFoundError) {
              const { contractAddress: notFoundContractAddress } = e.payload;
              errorMessage =
                notFoundContractAddress === contractAddress ? (
                  <T id="tokenContractNotFound" />
                ) : (
                  <T
                    id="referredByTokenContractNotFound"
                    substitutions={notFoundContractAddress}
                  />
                );
            } else if (e instanceof FetchURLError) {
              const url =
                e.payload.response?.url ||
                INCLUDES_URL_PATTERN.exec(e.message)?.[0];
              if (url) {
                errorMessage = (
                  <T id="errorWhileFetchingUrl" substitutions={url} />
                );
              } else {
                errorMessage = <T id="unknownParseErrorOccurred" />;
              }
            } else {
              errorMessage = <T id="unknownParseErrorOccurred" />;
            }
          } else {
            errorMessage = <T id="unknownParseErrorOccurred" />;
          }
          setValue([{ symbol: "" }, { name: "" }, { decimals: 0 }]);
          setTokenDataError(errorMessage);
          setBottomSectionVisible(true);
        });
      } finally {
        setLoadingToken(false);
      }
    })();
  }, [
    contractAddress,
    tezos,
    setValue,
    setBottomSectionVisible,
    networkId,
    tokenType.type,
    triggerValidation,
  ]);

  const cleanContractAddress = React.useCallback(() => {
    setValue("address", "");
    triggerValidation("address");
  }, [setValue, triggerValidation]);

  const onSubmit = React.useCallback(
    async ({ address, symbol, name, decimals, iconUrl }: FormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);
      try {
        addToken({
          type: tokenType.type,
          address,
          symbol,
          name,
          decimals: decimals || 0,
          iconUrl: iconUrl || undefined,
          fungible: true,
        });

        setAssetSymbol(symbol);
        setTimeout(() => navigate("/"), 50);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setSubmitError(err.message);
      }
    },
    [tokenType, formState.isSubmitting, addToken, setAssetSymbol]
  );

  return (
    <form
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
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

      <NoSpaceField
        ref={register({
          required: t("required"),
          validate: validateContractAddress,
        })}
        name="address"
        id="addtoken-address"
        textarea
        rows={2}
        cleanable={Boolean(contractAddress)}
        onClean={cleanContractAddress}
        label={t("address")}
        labelDescription={t("addressOfDeployedTokenContract")}
        placeholder={t("tokenContractPlaceholder")}
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
      />

      {tokenValidationError && (
        <Alert
          type="error"
          title={t("error")}
          autoFocus
          description={tokenValidationError}
          className="mb-8"
        />
      )}

      {tokenDataError && (
        <Alert
          type="warn"
          title={t("failedToParseMetadata")}
          autoFocus
          description={tokenDataError}
          className="mb-8"
        />
      )}

      <div
        className={classNames("w-full", {
          hidden: !bottomSectionVisible || loadingToken,
        })}
      >
        <BottomSection
          register={register}
          errors={errors}
          formState={formState}
          submitError={submitError}
        />
      </div>

      {loadingToken && (
        <div className="my-8 w-full flex items-center justify-center pb-4">
          <div>
            <Spinner theme="gray" className="w-20" />
          </div>
        </div>
      )}
    </form>
  );
};

type BottomSectionProps = Pick<
  FormContextValues,
  "register" | "errors" | "formState"
> & {
  submitError?: React.ReactNode;
};

const BottomSection: React.FC<BottomSectionProps> = (props) => {
  const { register, errors, formState, submitError } = props;

  return (
    <>
      <FormField
        ref={register({
          required: t("required"),
          pattern: {
            value: /^[a-zA-Z0-9]{2,5}$/,
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
            value: /^[a-zA-Z0-9 _-]{3,50}$/,
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
            <T id="iconURL" />{" "}
            <T id="optionalComment">
              {(message) => (
                <span className="text-sm font-light text-gray-600">
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

      {submitError && (
        <Alert
          type="error"
          title={t("error")}
          autoFocus
          description={submitError}
          className="mb-6"
        />
      )}

      <T id="addToken">
        {(message) => (
          <FormSubmitButton loading={formState.isSubmitting}>
            {message}
          </FormSubmitButton>
        )}
      </T>
    </>
  );
};

class TokenValidationError extends Error {}
