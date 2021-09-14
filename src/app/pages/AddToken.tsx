import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";

import classNames from "clsx";
import { FormContextValues, useForm } from "react-hook-form";
import { cache as swrCache } from "swr";
import { useDebouncedCallback } from "use-debounce";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import NoSpaceField from "app/atoms/NoSpaceField";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import PageLayout from "app/layouts/PageLayout";
import { useFormAnalytics } from "lib/analytics";
import { T, t } from "lib/i18n/react";
import {
  useTezos,
  validateContractAddress,
  useNetwork,
  NotMatchingStandardError,
  loadContractForCallLambdaView,
  useAssetsMetadata,
  toTokenSlug,
  NotFoundTokenMetadata,
  assertGetBalance,
  useChainId,
  useAccount,
  getBalanceSWRKey,
  detectTokenStandard,
  IncorrectTokenIdError,
  AssetMetadata,
  DetailedAssetMetdata,
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";
import { withErrorHumanDelay } from "lib/ui/humanDelay";
import useSafeState from "lib/ui/useSafeState";
import { navigate } from "lib/woozie";

const AddToken: FC = () => (
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

type FormData = {
  address: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  thumbnailUri: string;
};

type ComponentState = {
  processing: boolean;
  bottomSectionVisible: boolean;
  tokenValidationError: ReactNode;
  tokenDataError: ReactNode;
};

const INITIAL_STATE: ComponentState = {
  processing: false,
  bottomSectionVisible: false,
  tokenValidationError: null,
  tokenDataError: null,
};

class ContractNotFoundError extends Error {}

const Form: FC = () => {
  const tezos = useTezos();
  const { id: networkId } = useNetwork();
  const chainId = useChainId(true)!;
  const { publicKeyHash: accountPkh } = useAccount();

  const { fetchMetadata, setAssetsBaseMetadata } = useAssetsMetadata();

  const formAnalytics = useFormAnalytics("AddToken");

  const {
    register,
    handleSubmit,
    errors,
    formState,
    watch,
    setValue,
    triggerValidation,
  } = useForm<FormData>({
    mode: "onChange",
  });

  const contractAddress = watch("address");
  const tokenId = watch("id") || 0;

  const formValid = useMemo(
    () => validateContractAddress(contractAddress) === true && tokenId >= 0,
    [contractAddress, tokenId]
  );

  const [
    { processing, bottomSectionVisible, tokenValidationError, tokenDataError },
    setState,
  ] = useSafeState(INITIAL_STATE);
  const [submitError, setSubmitError] = useSafeState<ReactNode>(null);

  const attemptRef = useRef(0);
  const metadataRef = useRef<{
    base: AssetMetadata;
    detailed: DetailedAssetMetdata;
  }>();

  const loadMetadataPure = useCallback(async () => {
    if (!formValid) return;

    const attempt = ++attemptRef.current;
    setState({
      ...INITIAL_STATE,
      processing: true,
    });

    let stateToSet: Partial<ComponentState>;

    try {
      let contract;
      try {
        contract = await loadContractForCallLambdaView(tezos, contractAddress);
      } catch {
        throw new ContractNotFoundError();
      }

      const tokenStandard = await detectTokenStandard(tezos, contract);
      if (!tokenStandard) {
        throw new NotMatchingStandardError(
          "Failed when detecting token standard"
        );
      }

      await assertGetBalance(tezos, contract, tokenStandard, tokenId);

      const slug = toTokenSlug(contractAddress, tokenId);
      const metadata = await fetchMetadata(slug);

      metadataRef.current = metadata;

      const { base } = metadata;
      setValue([
        { symbol: base.symbol },
        { name: base.name },
        { decimals: base.decimals },
        { thumbnailUri: base.thumbnailUri },
      ]);

      stateToSet = {
        bottomSectionVisible: true,
      };
    } catch (err) {
      await withErrorHumanDelay(err, () => {
        if (err instanceof ContractNotFoundError) {
          stateToSet = {
            tokenValidationError: t(
              "referredByTokenContractNotFound",
              contractAddress
            ),
          };
        } else if (err instanceof NotMatchingStandardError) {
          stateToSet = {
            tokenValidationError: `${t("tokenDoesNotMatchStandard", "FA")}${
              err instanceof IncorrectTokenIdError ? `: ${err.message}` : ""
            }`,
          };
        } else {
          const errorMessage = t(
            err instanceof NotFoundTokenMetadata
              ? "failedToParseMetadata"
              : "unknownParseErrorOccurred"
          );

          setValue([{ symbol: "" }, { name: "" }, { decimals: 0 }]);

          stateToSet = {
            bottomSectionVisible: true,
            tokenDataError: errorMessage,
          };
        }
      });
    }

    if (attempt === attemptRef.current) {
      setState((currentState) => ({
        ...currentState,
        ...stateToSet,
        processing: false,
      }));
    }
  }, [
    tezos,
    setValue,
    setState,
    fetchMetadata,
    formValid,
    contractAddress,
    tokenId,
  ]);

  const loadMetadata = useDebouncedCallback(loadMetadataPure, 500);

  const loadMetadataRef = useRef(loadMetadata);
  useEffect(() => {
    loadMetadataRef.current = loadMetadata;
  }, [loadMetadata]);

  useEffect(() => {
    if (formValid) {
      loadMetadataRef.current();
    } else {
      setState(INITIAL_STATE);
      attemptRef.current++;
    }
  }, [setState, formValid, networkId, contractAddress, tokenId]);

  const cleanContractAddress = useCallback(() => {
    setValue("address", "");
    triggerValidation("address");
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(
    async ({ address, symbol, name, decimals, thumbnailUri, id }: FormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);

      formAnalytics.trackSubmit();
      try {
        const tokenSlug = toTokenSlug(address, id || 0);

        const metadataToSet = {
          ...(metadataRef.current?.base ?? {}),
          symbol,
          name,
          decimals: decimals ? +decimals : 0,
          thumbnailUri,
        };

        await setAssetsBaseMetadata({ [tokenSlug]: metadataToSet });

        await Repo.accountTokens.put(
          {
            type: Repo.ITokenType.Fungible,
            chainId,
            account: accountPkh,
            tokenSlug,
            status: Repo.ITokenStatus.Enabled,
            addedAt: Date.now(),
          },
          Repo.toAccountTokenKey(chainId, accountPkh, tokenSlug)
        );

        swrCache.delete(getBalanceSWRKey(tezos, tokenSlug, accountPkh));

        formAnalytics.trackSubmitSuccess();

        navigate({
          pathname: `/explore/${tokenSlug}`,
          search: "after_token_added=true",
        });
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setSubmitError(err.message);
      }
    },
    [
      tezos,
      formState.isSubmitting,
      chainId,
      accountPkh,
      setSubmitError,
      setAssetsBaseMetadata,
      formAnalytics,
    ]
  );

  return (
    <form
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
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
        containerClassName="mb-6"
      />

      <FormField
        ref={register({
          min: { value: 0, message: t("nonNegativeIntMessage") },
        })}
        min={0}
        type="number"
        name="id"
        id="token-id"
        label={`${t("tokenId")} ${t("optionalComment")}`}
        labelDescription={t("tokenIdInputDescription")}
        placeholder="0"
        errorCaption={errors.id?.message}
        containerClassName="mb-6"
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
          hidden: !bottomSectionVisible || processing,
        })}
      >
        <BottomSection
          register={register}
          errors={errors}
          formState={formState}
          submitError={submitError}
        />
      </div>

      {processing && (
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
  submitError?: ReactNode;
};

const BottomSection: FC<BottomSectionProps> = (props) => {
  const { register, errors, formState, submitError } = props;

  return (
    <>
      <FormField
        ref={register({
          required: t("required"),
          validate: (val: string) => {
            if (!val || val.length < 2 || val.length > 8) {
              return t("tokenSymbolPatternDescription");
            }
            return true;
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
            if (val.match(/(https:\/\/.*)/i) || val.match(/(ipfs:\/\/.*)/i)) {
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
        name="thumbnailUri"
        id="addtoken-thumbnailUri"
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
