import { WalletContract } from "@taquito/taquito";
import { tzip16, View } from "@taquito/tzip16";
import { tzip12 } from "@taquito/tzip12";
import * as React from "react";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
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
import { withErrorHumanDelay } from "lib/ui/humanDelay";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import NoSpaceField from "app/atoms/NoSpaceField";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import AssetField from "app/atoms/AssetField";

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
type TopFormData = {
  address: string;
  id?: number;
};

class MetadataParseError extends Error {}

const Form: React.FC = () => {
  const tezos = useTezos();
  const { id: networkId } = useNetwork();

  const {
    control,
    register,
    errors,
    watch,
    setValue,
    triggerValidation,
  } = useForm<TopFormData>({
    defaultValues: { id: 0 },
    reValidateMode: "onBlur",
  });
  const contractAddress = watch("address");
  const previousAddressRef = React.useRef<string>();
  const previousNetworkIdRef = React.useRef(networkId);
  const tokenId = watch("id");
  const previousTokenIdRef = React.useRef<number | undefined>(0);

  const [tokenDataError, setTokenDataError] = React.useState<React.ReactNode>(
    null
  );
  const [tokenType, setTokenType] = React.useState<ThanosCustomTokenType>();
  const tokenTypeRef = React.useRef<ThanosCustomTokenType>();
  const [
    tokenValidationError,
    setTokenValidationError,
  ] = React.useState<React.ReactNode>(null);
  const [loadingToken, setLoadingToken] = React.useState(false);
  const [bottomFormInitialData, setBottomFormInitialData] = React.useState<
    Partial<BottomFormData>
  >();

  React.useEffect(() => {
    setTokenValidationError(null);
    setBottomFormInitialData(undefined);
    if (validateContractAddress(contractAddress) !== true) {
      setTokenType(undefined);
      tokenTypeRef.current = undefined;
      previousAddressRef.current = undefined;
      previousTokenIdRef.current = 0;
      setBottomFormInitialData(undefined);
      previousNetworkIdRef.current = networkId;
      return;
    }
    triggerValidation("address");
    (async () => {
      try {
        setTokenDataError(null);
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

        if (
          previousAddressRef.current !== contractAddress ||
          previousNetworkIdRef.current !== networkId
        ) {
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
                setTokenType(undefined);
                setValue("id", 0);
                setBottomFormInitialData(undefined);
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
          if (tokenId === undefined) {
            setBottomFormInitialData(undefined);
            setLoadingToken(false);
            previousAddressRef.current = contractAddress;
            previousTokenIdRef.current = tokenId;
            return;
          } else {
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
        } else {
          previousAddressRef.current = contractAddress;
          previousTokenIdRef.current = tokenId;
          return;
        }

        if (!tokenType) {
          return;
        }

        let tokenData;
        try {
          if (tokenType === ThanosAssetType.FA1_2) {
            await assertTokenType(tokenType, contract, tezos);
            const tzipFetchableContract = await tezos.wallet.at(
              contractAddress,
              tzip16
            );
            try {
              const {
                metadata,
              } = await tzipFetchableContract.tzip16().getMetadata();
              const views = await tzipFetchableContract
                .tzip16()
                .metadataViews();
              tokenData = {
                decimals: await views
                  .decimals?.()
                  .executeView()
                  .catch(() => undefined),
                onetoken: await views
                  .onetoken?.()
                  .executeView()
                  .catch(() => undefined),
                ...metadata,
              };
            } catch (e) {
              throw new MetadataParseError(e.message);
            }
          } else {
            await assertTokenType(tokenType, contract, tezos, tokenId!);
            let views: Record<string, () => View> = {};
            try {
              const tzip16FetchableContract = await tezos.wallet.at(
                contractAddress,
                tzip16
              );
              views = await tzip16FetchableContract.tzip16().metadataViews();
            } catch (e) {}

            try {
              const tzipFetchableContract = await tezos.wallet.at(
                contractAddress,
                tzip12
              );
              const tzip12Metadata = await tzipFetchableContract
                .tzip12()
                .getTokenMetadata(tokenId!);

              if (tzip12Metadata && Object.keys(tzip12Metadata).length > 0) {
                tokenData = tzip12Metadata;
              } else {
                tokenData = await views
                  .token_metadata?.()
                  .executeView(tokenId!)
                  .catch(() => undefined);
              }

              if (tokenData) {
                tokenData.icon = await views.icon?.().executeView(tokenId!);
              }
            } catch (e) {
              throw new MetadataParseError(e.message);
            }
          }
        } catch (err) {
          if (err instanceof MetadataParseError) {
            throw err;
          } else if (err instanceof NotMatchingStandardError) {
            throw new TokenValidationError(
              `${t(
                "tokenDoesNotMatchStandard",
                tokenType === ThanosAssetType.FA1_2 ? "FA1.2" : "FA2"
              )}: ${err.message}`
            );
          } else {
            throw new TokenValidationError(err.message);
          }
        }

        const { symbol = "", name = "", decimals = 0, icon = "" } =
          tokenData || {};

        setBottomFormInitialData({
          symbol: symbol.substr(0, 5),
          name: name.substr(0, 50),
          decimals,
          iconUrl: icon,
        });
      } catch (e) {
        withErrorHumanDelay(e, () => {
          if (e instanceof TokenValidationError) {
            setTokenValidationError(e.message);
            return;
          }
          let errorMessage =
            e instanceof MetadataParseError ? (
              e.message
            ) : (
              <T id="unknownParseErrorOccurred" />
            );
          setBottomFormInitialData({
            symbol: "",
            name: "",
            decimals: 0,
          });
          setTokenDataError(errorMessage);
        });
      } finally {
        setLoadingToken(false);
        previousAddressRef.current = contractAddress;
        previousTokenIdRef.current = tokenId;
        previousNetworkIdRef.current = networkId;
      }
    })();
  }, [
    contractAddress,
    tezos,
    setValue,
    networkId,
    triggerValidation,
    tokenId,
    tokenType,
  ]);

  const cleanContractAddress = React.useCallback(() => {
    setValue("address", "");
    triggerValidation("address");
  }, [setValue, triggerValidation]);

  const isFA2Token = tokenType === ThanosAssetType.FA2;

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <div className="mb-4 flex flex-col">
        <h2 className="leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="tokenType" />
          </span>
        </h2>
      </div>

      <form>
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
          className={classNames(
            "mb-6",
            "flex flex-col",
            !isFA2Token && "hidden"
          )}
        >
          <Controller
            as={AssetField}
            control={control}
            rules={{
              min: { value: 0, message: t("nonNegativeIntMessage") },
              required: isFA2Token ? t("required") : undefined,
            }}
            name="id"
            id="token-id"
            label={t("tokenId")}
            labelDescription={t("tokenIdInputDescription")}
            placeholder="0"
            errorCaption={errors.id?.message}
          />
        </div>
      </form>

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

      <BottomForm
        hidden={!bottomFormInitialData}
        address={contractAddress}
        initialData={bottomFormInitialData}
        tokenType={tokenType}
        id={tokenId}
      />

      {loadingToken && (
        <div className="my-8 w-full flex items-center justify-center pb-4">
          <div>
            <Spinner theme="gray" className="w-20" />
          </div>
        </div>
      )}
    </div>
  );
};

type BottomFormData = {
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
};
type BottomFormProps = {
  address?: string;
  hidden?: boolean;
  initialData?: Partial<BottomFormData>;
  tokenType?: ThanosCustomTokenType;
  id?: number;
};

const BottomForm: React.FC<BottomFormProps> = (props) => {
  const { address, hidden, initialData, tokenType, id } = props;
  const {
    handleSubmit,
    register,
    errors,
    formState,
    reset,
  } = useForm<BottomFormData>({
    defaultValues: initialData,
  });
  const prevInitialDataRef = React.useRef(initialData);

  const { addToken } = useTokens();
  const [submitError, setSubmitError] = React.useState<React.ReactNode>(null);

  React.useEffect(() => {
    if (prevInitialDataRef.current !== initialData) {
      reset(initialData);
      setSubmitError(null);
    }
    prevInitialDataRef.current = initialData;
  }, [initialData, reset]);

  const onSubmit = React.useCallback(
    async ({ symbol, name, decimals, iconUrl }: BottomFormData) => {
      if (formState.isSubmitting || !tokenType || !address) {
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
          tokenType === ThanosAssetType.FA1_2
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
    [formState.isSubmitting, address, id, tokenType, addToken]
  );

  return (
    <form
      className={classNames("w-full", { hidden })}
      onSubmit={handleSubmit(onSubmit)}
    >
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
    </form>
  );
};

class TokenValidationError extends Error {}
