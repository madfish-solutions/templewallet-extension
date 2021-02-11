import { WalletContract, compose } from "@taquito/taquito";
import { tzip16 } from "@taquito/tzip16";
import { tzip12 } from "@taquito/tzip12";
import * as React from "react";
import classNames from "clsx";
import { Controller, FormContextValues, useForm } from "react-hook-form";
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
} from "lib/thanos/front";
import { sanitizeImgUri } from "lib/image-uri";
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
  },
  {
    type: ThanosAssetType.FA2 as const,
    name: "FA 2",
  },
];

type ThanosCustomTokenType = ThanosAssetType.FA1_2 | ThanosAssetType.FA2;
type FormData = {
  address: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
  type: ThanosCustomTokenType;
};

class MetadataParseError extends Error {}

const Form: React.FC = () => {
  const { addToken } = useTokens();
  const tezos = useTezos();
  const { id: networkId } = useNetwork();

  const {
    control,
    register,
    handleSubmit,
    errors,
    formState,
    watch,
    setValue,
    triggerValidation,
  } = useForm<FormData>({
    defaultValues: { decimals: 0, type: TOKEN_TYPES[0].type, id: 0 },
  });
  const contractAddress = watch("address");
  const tokenType = watch("type");
  const tokenId = watch("id");
  const [submitError, setSubmitError] = React.useState<React.ReactNode>(null);
  const [tokenDataError, setTokenDataError] = React.useState<React.ReactNode>(
    null
  );
  const [
    tokenValidationError,
    setTokenValidationError,
  ] = React.useState<React.ReactNode>(null);
  const [bottomSectionVisible, setBottomSectionVisible] = useSafeState(false);
  const [loadingToken, setLoadingToken] = React.useState(false);

  React.useEffect(() => {
    setTokenValidationError(null);
    setBottomSectionVisible(false);
    if (
      validateContractAddress(contractAddress) !== true ||
      tokenId === undefined ||
      String(tokenId) === ""
    ) {
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

        let tokenData: any;
        let latestErrMessage;

        try {
          /**
           * Assert token standard
           */
          if (tokenType === ThanosAssetType.FA1_2) {
            await assertTokenType(tokenType, contract, tezos);
          } else {
            await assertTokenType(tokenType, contract, tezos, tokenId!);
          }

          /**
           * Fetch taquito contract instance that is capable of metadata
           */
          const metadataContract = await tezos.wallet.at(
            contractAddress,
            compose(tzip12, tzip16)
          );

          /**
           * Try fetch token data with TZIP12
           */
          try {
            tokenData = await metadataContract
              .tzip12()
              .getTokenMetadata(tokenId ?? 0);
          } catch (err) {
            latestErrMessage = err.message;
          }

          /**
           * Try fetch token data with TZIP16
           * Get them from plain tzip16 structure/scheme
           */
          if (!tokenData || Object.keys(tokenData).length === 0) {
            try {
              const {
                metadata,
              } = await metadataContract.tzip16().getMetadata();
              tokenData = metadata;
            } catch (err) {
              latestErrMessage = err.message;
            }
          }

          if (!tokenData) {
            throw new MetadataParseError(latestErrMessage ?? "Unknown error");
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

        const { symbol = "", name = "", decimals = 0 } = tokenData || {};
        const iconUrl =
          tokenData.thumbnailUri ??
          tokenData.logo ??
          tokenData.icon ??
          tokenData.iconUri ??
          tokenData.iconUrl ??
          "";

        setValue([
          { symbol: symbol.substr(0, 5) },
          { name: name.substr(0, 50) },
          { decimals },
          { iconUrl },
        ]);
        setBottomSectionVisible(true);
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
    tokenType,
    triggerValidation,
    tokenId,
  ]);

  const cleanContractAddress = React.useCallback(() => {
    setValue("address", "");
    triggerValidation("address");
  }, [setValue, triggerValidation]);

  const onSubmit = React.useCallback(
    async ({
      address,
      symbol,
      name,
      decimals,
      iconUrl,
      type: tokenType,
      id,
    }: FormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);
      try {
        const tokenCommonProps = {
          address,
          symbol,
          name,
          decimals: decimals || 0,
          iconUrl: iconUrl ? sanitizeImgUri(iconUrl) : undefined,
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
    [formState.isSubmitting, addToken]
  );

  const isFA12Token = tokenType === ThanosAssetType.FA1_2;

  return (
    <form
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-4 flex flex-col">
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <span className="text-base font-semibold text-gray-700">
            <T id="tokenType" />
          </span>
        </h2>

        <Controller name="type" as={TokenTypeSelect} control={control} />
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
        containerClassName={isFA12Token ? "mb-6" : "mb-4"}
      />

      <div
        className={classNames("mb-6", "flex flex-col", isFA12Token && "hidden")}
      >
        <FormField
          ref={register({
            min: { value: 0, message: t("nonNegativeIntMessage") },
            required: isFA12Token ? undefined : t("required"),
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

type TokenTypeSelectProps = {
  value?: ThanosCustomTokenType;
  onChange: (newValue: ThanosCustomTokenType) => void;
};

const TokenTypeSelect = React.memo<TokenTypeSelectProps>((props) => {
  const { value, onChange } = props;

  return (
    <div
      className={classNames(
        "rounded-md overflow-hidden",
        "border-2 bg-gray-100",
        "flex flex-col",
        "text-gray-700 text-sm leading-tight"
      )}
    >
      {TOKEN_TYPES.map(({ type: tokenType }, index) => (
        <TokenTypeOption
          key={tokenType}
          active={tokenType === value}
          last={index === TOKEN_TYPES.length - 1}
          value={tokenType}
          onClick={onChange}
        />
      ))}
    </div>
  );
});

type TokenTypeOptionProps = {
  active: boolean;
  last: boolean;
  value: ThanosCustomTokenType;
  onClick: (value: ThanosCustomTokenType) => void;
};

const TokenTypeOption: React.FC<TokenTypeOptionProps> = (props) => {
  const { active, last, value, onClick } = props;

  const handleClick = React.useCallback(() => onClick(value), [onClick, value]);

  return (
    <button
      type="button"
      className={classNames(
        "block w-full",
        "overflow-hidden",
        !last && "border-b border-gray-200",
        active ? "bg-gray-300" : "hover:bg-gray-200 focus:bg-gray-200",
        "flex items-center",
        "text-gray-700 font-medium",
        "transition ease-in-out duration-200",
        "focus:outline-none",
        "opacity-90 hover:opacity-100"
      )}
      style={{
        padding: "0.4rem 0.375rem 0.4rem 0.375rem",
      }}
      onClick={handleClick}
    >
      {TOKEN_TYPES.find(({ type }) => type === value)!.name}
    </button>
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
          validate: (val: string) => {
            if (!val) return true;
            if (
              val.match(/(https:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i) ||
              val.match(/(ipfs:\/\/.*)/i)
            ) {
              return true;
            }

            return (
              <ul className="list-disc list-inside">
                <T id="validImageURL">{(message) => <li>{message}</li>}</T>
                <T id="onlyHTTPS">{(message) => <li>{message}</li>}</T>
                <T id="formatsAllowed">{(message) => <li>{message}</li>}</T>
                <T id="orIPFSImageURL">{(message) => <li>{message}</li>}</T>
              </ul>
            );
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
