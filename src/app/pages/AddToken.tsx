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
  ThanosToken,
  ThanosAssetType,
  useTokens,
  useTezos,
  validateContractAddress,
  useNetwork,
  assertTokenType,
  NotMatchingStandardError,
  loadContractForCallLambdaView,
  getAssetKey,
  UndefinedTokenError,
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

type ThanosCustomTokenType = ThanosAssetType.FA1_2 | ThanosAssetType.FA2;
type FormData = {
  address: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
};

const Form: React.FC = () => {
  const { addToken } = useTokens();
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
    defaultValues: { decimals: 0, id: 0 },
  });
  const contractAddress = watch("address");
  const previousAddressRef = React.useRef<string>();
  const tokenId = watch("id");
  const previousTokenIdRef = React.useRef<number | undefined>(0);
  const [submitError, setSubmitError] = React.useState<React.ReactNode>(null);
  const [tokenDataError, setTokenDataError] = React.useState<React.ReactNode>(
    null
  );
  const [tokenType, setTokenType] = React.useState<ThanosCustomTokenType>();
  const tokenTypeRef = React.useRef<ThanosCustomTokenType>();
  const [
    tokenValidationError,
    setTokenValidationError,
  ] = React.useState<React.ReactNode>(null);
  const [bottomSectionVisible, setBottomSectionVisible] = useSafeState(false);
  const [loadingToken, setLoadingToken] = React.useState(false);

  React.useEffect(() => {
    setTokenValidationError(null);
    setBottomSectionVisible(false);
    if (validateContractAddress(contractAddress) !== true) {
      return;
    }
    triggerValidation("address");
    (async () => {
      try {
        setTokenDataError(null);
        setSubmitError(null);
        setLoadingToken(true);

        let contract: WalletContract;
        try {
          contract = await loadContractForCallLambdaView(
            tezos,
            contractAddress
          );
        } catch (_err) {
          throw new TokenValidationError(t("contractNotAvailable"));
        }

        if (previousAddressRef.current !== contractAddress) {
          try {
            await assertTokenType(ThanosAssetType.FA1_2, contract, tezos);
            tokenTypeRef.current = ThanosAssetType.FA1_2;
            setTokenType(ThanosAssetType.FA1_2);
          } catch (fa12Error) {
            try {
              await assertTokenType(ThanosAssetType.FA2, contract, tezos, 0);
              tokenTypeRef.current = ThanosAssetType.FA2;
              setTokenType(ThanosAssetType.FA2);
              setValue("id", 0);
            } catch (fa2Error) {
              if (fa2Error instanceof UndefinedTokenError) {
                tokenTypeRef.current = ThanosAssetType.FA2;
                setTokenType(ThanosAssetType.FA2);
                setValue("id", undefined);
              } else {
                tokenTypeRef.current = undefined;
                setTokenType(undefined);
                setValue("id", 0);
                if (fa2Error instanceof NotMatchingStandardError) {
                  throw new TokenValidationError(
                    t("tokenDoesNotMatchAnyStandard", [
                      fa12Error.message as string,
                      fa2Error.message,
                    ])
                  );
                } else {
                  throw new TokenValidationError(fa2Error.message);
                }
              }
            }
          }
        } else if (
          previousTokenIdRef.current !== tokenId &&
          tokenTypeRef.current === ThanosAssetType.FA2
        ) {
          try {
            await assertTokenType(
              ThanosAssetType.FA2,
              contract,
              tezos,
              tokenId!
            );
          } catch (e) {
            throw new TokenValidationError(e.message);
          }
        }

        const tokenData =
          (await getTokenMetadata(
            tezos,
            contractAddress,
            networkId,
            tokenId === undefined ||
              tokenTypeRef.current === ThanosAssetType.FA1_2
              ? undefined
              : String(tokenId)
          )) || {};
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
        previousAddressRef.current = contractAddress;
        previousTokenIdRef.current = tokenId;
      }
    })();
  }, [
    contractAddress,
    tezos,
    setValue,
    setBottomSectionVisible,
    networkId,
    triggerValidation,
    tokenId,
  ]);

  const cleanContractAddress = React.useCallback(() => {
    setValue("address", "");
    triggerValidation("address");
  }, [setValue, triggerValidation]);

  const onSubmit = React.useCallback(
    async ({ address, symbol, name, decimals, iconUrl, id }: FormData) => {
      if (formState.isSubmitting || !tokenTypeRef.current) {
        return;
      }

      setSubmitError(null);
      try {
        const tokenCommonProps = {
          address,
          symbol,
          name,
          decimals: decimals || 0,
          iconUrl: iconUrl || undefined,
          fungible: true,
        };

        const newToken: ThanosToken =
          tokenTypeRef.current === ThanosAssetType.FA1_2
            ? {
                type: ThanosAssetType.FA1_2,
                ...tokenCommonProps,
              }
            : {
                type: ThanosAssetType.FA2,
                id: Number(id!),
                ...tokenCommonProps,
              };

        addToken(newToken);
        const assetKey = getAssetKey(newToken);

        // Wait a little bit while the tokens updated
        await new Promise((r) => setTimeout(r, 300));
        navigate(`/explore/${assetKey}`);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setSubmitError(err.message);
      }
    },
    [formState.isSubmitting, addToken]
  );

  const isFA2Token = tokenType === ThanosAssetType.FA2;

  return (
    <form
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-4 flex flex-col">
        <h2 className="leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="tokenType" />
          </span>
        </h2>
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
        containerClassName={isFA2Token ? "mb-4" : "mb-6"}
      />

      <div
        className={classNames("mb-6", "flex flex-col", !isFA2Token && "hidden")}
      >
        <FormField
          ref={register({
            min: { value: 0, message: t("nonNegativeIntMessage") },
            required: isFA2Token ? t("required") : undefined,
          })}
          min={0}
          type="number"
          name="id"
          id="token-id"
          label={t("tokenId")}
          labelDescription={t("tokenIdInputDescription")}
          placeholder="0"
          errorCaption={errors.id?.message}
        />
      </div>

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
