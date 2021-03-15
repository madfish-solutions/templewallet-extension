import { WalletContract } from "@taquito/taquito";
import * as React from "react";
import classNames from "clsx";
import { Controller, FormContextValues, useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  TempleToken,
  TempleAssetType,
  useTokens,
  useTezos,
  validateContractAddress,
  useNetwork,
  assertTokenType,
  NotMatchingStandardError,
  loadContractForCallLambdaView,
  getAssetKey,
  fetchTokenMetadata,
  MetadataParseError,
} from "lib/temple/front";
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
    type: TempleAssetType.FA1_2 as const,
    name: "FA 1.2",
  },
  {
    type: TempleAssetType.FA2 as const,
    name: "FA 2",
  },
];

type TempleCustomTokenType = TempleAssetType.FA1_2 | TempleAssetType.FA2;
type FormData = {
  address: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
  type: TempleCustomTokenType;
};

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

        let tokenData;

        try {
          /**
           * Assert token standard
           */
          if (tokenType === TempleAssetType.FA1_2) {
            await assertTokenType(tokenType, contract, tezos);
          } else {
            await assertTokenType(tokenType, contract, tezos, tokenId!);
          }

          tokenData = await fetchTokenMetadata(tezos, contractAddress, tokenId);
        } catch (err) {
          if (err instanceof MetadataParseError) {
            throw err;
          } else if (err instanceof NotMatchingStandardError) {
            throw new TokenValidationError(
              `${t(
                "tokenDoesNotMatchStandard",
                tokenType === TempleAssetType.FA1_2 ? "FA1.2" : "FA2"
              )}: ${err.message}`
            );
          } else {
            throw new TokenValidationError(err.message);
          }
        }

        setValue([
          { symbol: tokenData.symbol.substr(0, 8) },
          { name: tokenData.name.substr(0, 50) },
          { decimals: tokenData.decimals },
          { iconUrl: tokenData.iconUrl },
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
          decimals: decimals ? +decimals : 0,
          iconUrl: iconUrl ? sanitizeImgUri(iconUrl) : undefined,
          fungible: true,
          status: "displayed" as const,
        };

        const newToken: TempleToken =
          tokenType === TempleAssetType.FA1_2
            ? {
                type: TempleAssetType.FA1_2,
                ...tokenCommonProps,
              }
            : {
                type: TempleAssetType.FA2,
                id: Number(id!),
                ...tokenCommonProps,
              };

        await addToken(newToken);
        const assetKey = getAssetKey(newToken);

        // Wait a little bit while the tokens updated
        await new Promise((r) => setTimeout(r, 300));
        navigate({
          pathname: `/explore/${assetKey}`,
          search: "after_token_added=true",
        });
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

  const isFA12Token = tokenType === TempleAssetType.FA1_2;

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
  value?: TempleCustomTokenType;
  onChange: (newValue: TempleCustomTokenType) => void;
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
  value: TempleCustomTokenType;
  onClick: (value: TempleCustomTokenType) => void;
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
          validate: (val: string) => {
            if (!val || val.length < 3 || val.length > 50) {
              return t("tokenNamePatternDescription");
            }
            return true;
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
