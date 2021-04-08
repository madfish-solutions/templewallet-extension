import React, {
  Dispatch,
  FC,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { DEFAULT_FEE, WalletOperation } from "@taquito/taquito";
import type { Estimate } from "@taquito/taquito/dist/types/contract/estimate";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";

import AccountTypeBadge from "app/atoms/AccountTypeBadge";
import Alert from "app/atoms/Alert";
import AssetField from "app/atoms/AssetField";
import { Button } from "app/atoms/Button";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import Name from "app/atoms/Name";
import NoSpaceField from "app/atoms/NoSpaceField";
import Spinner from "app/atoms/Spinner";
import {
  ArtificialError,
  NotEnoughFundsError,
  ZeroBalanceError,
  ZeroTEZBalanceError,
} from "app/defaults";
import { useAppEnv } from "app/env";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";
import { ReactComponent as ChevronUpIcon } from "app/icons/chevron-up.svg";
import AdditionalFeeInput, {
  AdditionalFeeValue,
} from "app/templates/AdditionalFeeInput";
import AssetSelect from "app/templates/AssetSelect";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import OperationStatus from "app/templates/OperationStatus";
import {
  AnalyticsEventCategory,
  useAnalytics,
  useFormAnalytics,
} from "lib/analytics";
import { toLocalFixed } from "lib/i18n/numbers";
import { T, t } from "lib/i18n/react";
import { transferImplicit, transferToContract } from "lib/michelson";
import {
  fetchBalance,
  getAssetKey,
  hasManager,
  isAddressValid,
  isDomainNameValid,
  isKTAddress,
  loadContract,
  mutezToTz,
  TempleAccountType,
  TempleAsset,
  TempleAssetType,
  TEZ_ASSET,
  toPenny,
  toTransferParams,
  tzToMutez,
  useAccount,
  useAssetBySlug,
  useBalance,
  useRelevantAccounts,
  useTezos,
  useTezosDomainsClient,
  useUSDPrice,
  useNetwork,
  TempleToken,
  GasStation,
} from "lib/temple/front";
import { getAvailableTokens, getTokenPrice } from "lib/tezos-gsn";
import useSafeState from "lib/ui/useSafeState";
import { navigate, HistoryAction } from "lib/woozie";

import { SendFormSelectors } from "./SendForm.selectors";

interface FormData {
  to: string;
  amount: number;
  fee: AdditionalFeeValue;
}

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

type SendFormProps = {
  assetSlug?: string | null;
};

const SendForm: FC<SendFormProps> = ({ assetSlug }) => {
  const asset = useAssetBySlug(assetSlug) ?? TEZ_ASSET;
  const tezos = useTezos();
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);
  const { trackEvent } = useAnalytics();

  const handleAssetChange = useCallback(
    (a: TempleAsset) => {
      trackEvent(
        SendFormSelectors.AssetItemButton,
        AnalyticsEventCategory.ButtonPress
      );
      navigate(`/send/${getAssetKey(a)}`, HistoryAction.Replace);
    },
    [trackEvent]
  );

  return (
    <>
      {operation && (
        <OperationStatus typeTitle={t("transaction")} operation={operation} />
      )}

      <AssetSelect
        value={asset}
        onChange={handleAssetChange}
        className="mb-6"
      />

      <Suspense fallback={<SpinnerSection />}>
        <Form localAsset={asset} setOperation={setOperation} />
      </Suspense>
    </>
  );
};

export default SendForm;

type FormProps = {
  localAsset: TempleAsset;
  setOperation: Dispatch<any>;
};

const defaultFeeValue: AdditionalFeeValue = {
  inToken: false,
  amount: RECOMMENDED_ADD_FEE,
};

const Form: FC<FormProps> = ({ localAsset, setOperation }) => {
  const { registerBackHandler } = useAppEnv();
  const tezPrice = useUSDPrice();

  const allAccounts = useRelevantAccounts();
  const network = useNetwork();
  const acc = useAccount();
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();

  const formAnalytics = useFormAnalytics("SendForm");

  const canUseDomainNames = domainsClient.isSupported;
  const accountPkh = acc.publicKeyHash;

  const { data: balanceData, mutate: mutateBalance } = useBalance(
    localAsset,
    accountPkh
  );
  const balance = balanceData!;
  const balanceNum = balance.toNumber();

  const { data: tezBalanceData, mutate: mutateTezBalance } = useBalance(
    TEZ_ASSET,
    accountPkh
  );
  const tezBalance = tezBalanceData!;
  const tezBalanceNum = tezBalance.toNumber();

  const [shouldUseUsd, setShouldUseUsd] = useSafeState(false);

  const canToggleUsd =
    network.type === "main" &&
    localAsset.type === TempleAssetType.TEZ &&
    tezPrice !== null;
  const prevCanToggleUsd = useRef(canToggleUsd);

  /**
   * Form
   */

  const {
    watch,
    handleSubmit,
    errors,
    control,
    formState,
    setValue,
    triggerValidation,
    reset,
    getValues,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      fee: defaultFeeValue,
    },
  });

  const handleUsdToggle = useCallback(
    (evt) => {
      evt.preventDefault();

      const newShouldUseUsd = !shouldUseUsd;
      setShouldUseUsd(newShouldUseUsd);
      if (!getValues().amount) {
        return;
      }
      const amount = new BigNumber(getValues().amount);
      setValue(
        "amount",
        Number(
          (newShouldUseUsd
            ? amount.multipliedBy(tezPrice!)
            : amount.div(tezPrice!)
          ).toFormat(newShouldUseUsd ? 2 : 6, BigNumber.ROUND_FLOOR, {
            decimalSeparator: ".",
          })
        )
      );
    },
    [setShouldUseUsd, shouldUseUsd, getValues, tezPrice, setValue]
  );
  useEffect(() => {
    if (!canToggleUsd && prevCanToggleUsd.current && shouldUseUsd) {
      setShouldUseUsd(false);
      setValue("amount", undefined);
    }
    prevCanToggleUsd.current = canToggleUsd;
  }, [setShouldUseUsd, canToggleUsd, shouldUseUsd, setValue]);

  const toValue = watch("to");
  const amountValue = watch("amount");
  const feeValue = watch("fee") ?? defaultFeeValue;

  const toFieldRef = useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = useRef<HTMLInputElement>(null);

  const toFilledWithAddress = useMemo(
    () => Boolean(toValue && isAddressValid(toValue)),
    [toValue]
  );

  const toFilledWithDomain = useMemo(
    () => toValue && isDomainNameValid(toValue, domainsClient),
    [toValue, domainsClient]
  );

  const domainAddressFactory = useCallback(
    (_k: string, _checksum: string, toValue: string) =>
      domainsClient.resolver.resolveNameToAddress(toValue),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(
    ["tzdns-address", tezos.checksum, toValue],
    domainAddressFactory,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );
  const { data: availableTokensResponse } = useSWR(
    ["station-available-tokens"],
    getAvailableTokens,
    { revalidateOnFocus: false }
  );
  const localAssetType = localAsset.type;
  const localAssetAddress =
    localAsset.type === TempleAssetType.TEZ ? undefined : localAsset.address;
  const localAssetId =
    localAsset.type === TempleAssetType.FA2 ? localAsset.id : undefined;
  const canPayFeeInTokens = useMemo(
    () =>
      availableTokensResponse?.tokens.some(({ contractAddress, tokenId }) => {
        return (
          localAssetAddress === contractAddress &&
          (localAssetType !== TempleAssetType.FA2 || tokenId === localAssetId)
        );
      }) ?? false,
    [availableTokensResponse, localAssetAddress, localAssetId, localAssetType]
  );

  const getGasTokenPrice = useCallback(
    async (
      _k: string,
      shouldGet: boolean,
      tokenAddress: string,
      tokenId?: number
    ) => {
      if (!shouldGet) {
        return null;
      }
      return (await getTokenPrice({ tokenAddress, tokenId })).price;
    },
    []
  );
  const { data: gasTokenPrice } = useSWR(
    ["gas-token-price", canPayFeeInTokens, localAssetAddress, localAssetId],
    getGasTokenPrice
  );

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(() => resolvedAddress || toValue, [
    resolvedAddress,
    toValue,
  ]);

  const filledAccount = useMemo(
    () =>
      (toResolved && allAccounts.find((a) => a.publicKeyHash === toResolved)) ||
      null,
    [allAccounts, toResolved]
  );

  const cleanToField = useCallback(() => {
    setValue("to", "");
    triggerValidation("to");
  }, [setValue, triggerValidation]);

  useLayoutEffect(() => {
    if (toFilled) {
      toFieldRef.current?.scrollIntoView({ block: "center" });
    }
  }, [toFilled]);

  useLayoutEffect(() => {
    if (toFilled) {
      return registerBackHandler(() => {
        cleanToField();
        window.scrollTo(0, 0);
      });
    }
    return;
  }, [toFilled, registerBackHandler, cleanToField]);

  const estimateBaseFee = useCallback(async () => {
    try {
      const to = toResolved;
      const tez = localAsset.type === TempleAssetType.TEZ;

      const balanceBN = (await mutateBalance(
        fetchBalance(tezos, localAsset, accountPkh)
      ))!;
      if (balanceBN.isZero()) {
        throw new ZeroBalanceError();
      }

      if (feeValue.inToken) {
        const elementaryParts = new BigNumber(10).pow(localAsset.decimals);
        const [
          preTransferParams,
          { pubkey, signature, hash },
        ] = await GasStation.forgeTxAndParams(tezos, {
          to,
          tokenAddress: localAssetAddress!,
          tokenId: localAssetId,
          amount: amountValue
            ? elementaryParts.multipliedBy(amountValue).toNumber()
            : 1,
          relayerFee: 1,
        });
        const gasEstimate =
          (await GasStation.estimate(tezos, {
            pubkey,
            signature,
            hash,
            contractAddress: localAssetAddress!,
            callParams: {
              entrypoint: "transfer",
              params: preTransferParams,
            },
          })) + 100;
        const result = new BigNumber(gasEstimate)
          .multipliedBy(gasTokenPrice ?? 0)
          .multipliedBy(elementaryParts)
          .integerValue()
          .div(elementaryParts);
        return result;
      }

      let tezBalanceBN: BigNumber;
      if (!tez) {
        tezBalanceBN = (await mutateTezBalance(
          fetchBalance(tezos, TEZ_ASSET, accountPkh)
        ))!;
        if (tezBalanceBN.isZero()) {
          throw new ZeroTEZBalanceError();
        }
      }

      const [transferParams, manager] = await Promise.all([
        toTransferParams(
          tezos,
          localAsset,
          accountPkh,
          to,
          toPenny(localAsset)
        ),
        tezos.rpc.getManagerKey(
          acc.type === TempleAccountType.ManagedKT ? acc.owner : accountPkh
        ),
      ]);

      let estmtnMax: Estimate;
      if (acc.type === TempleAccountType.ManagedKT) {
        const michelsonLambda = isKTAddress(to)
          ? transferToContract
          : transferImplicit;

        const contract = await loadContract(tezos, acc.publicKeyHash);
        const transferParams = contract.methods
          .do(michelsonLambda(to, tzToMutez(balanceBN)))
          .toTransferParams();
        estmtnMax = await tezos.estimate.transfer(transferParams);
      } else if (tez) {
        const estmtn = await tezos.estimate.transfer(transferParams);
        let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
        if (!hasManager(manager)) {
          amountMax = amountMax.minus(mutezToTz(DEFAULT_FEE.REVEAL));
        }
        estmtnMax = await tezos.estimate.transfer({
          to,
          amount: amountMax.toNumber(),
        });
      } else {
        estmtnMax = await tezos.estimate.transfer(transferParams);
      }

      // console.info({
      //   burnFeeMutez: estmtnMax.burnFeeMutez,
      //   consumedMilligas: estmtnMax.consumedMilligas,
      //   gasLimit: estmtnMax.gasLimit,
      //   minimalFeeMutez: estmtnMax.minimalFeeMutez,
      //   storageLimit: estmtnMax.storageLimit,
      //   suggestedFeeMutez: estmtnMax.suggestedFeeMutez,
      //   totalCost: estmtnMax.totalCost,
      //   usingBaseFeeMutez: estmtnMax.usingBaseFeeMutez,
      // });

      let baseFee = mutezToTz(estmtnMax.totalCost);
      if (!hasManager(manager)) {
        baseFee = baseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (
        tez
          ? baseFee.isGreaterThanOrEqualTo(balanceBN)
          : baseFee.isGreaterThan(tezBalanceBN!)
      ) {
        throw new NotEnoughFundsError();
      }

      return baseFee;
    } catch (err) {
      // Human delay
      await new Promise((r) => setTimeout(r, 300));

      if (err instanceof ArtificialError) {
        return err;
      }

      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      switch (true) {
        default:
          throw err;
      }
    }
  }, [
    acc,
    feeValue.inToken,
    gasTokenPrice,
    tezos,
    localAsset,
    localAssetId,
    localAssetAddress,
    accountPkh,
    toResolved,
    mutateBalance,
    mutateTezBalance,
    amountValue,
  ]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating,
  } = useSWR(
    () =>
      toFilled
        ? [
            "transfer-base-fee",
            tezos.checksum,
            localAsset.symbol,
            accountPkh,
            toResolved,
            feeValue.inToken,
          ]
        : null,
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 30_000,
    }
  );
  const estimationError = !estimating
    ? baseFee instanceof Error
      ? baseFee
      : estimateBaseFeeError
    : null;

  const maxAddFee = useMemo(() => {
    if (baseFee instanceof BigNumber && feeValue.inToken) {
      return new BigNumber(balanceNum).minus(baseFee).toNumber();
    }
    if (baseFee instanceof BigNumber) {
      return new BigNumber(tezBalanceNum)
        .minus(baseFee)
        .minus(PENNY)
        .toNumber();
    }
    return;
  }, [tezBalanceNum, baseFee, balanceNum, feeValue.inToken]);

  const safeFeeValue = useMemo(
    () =>
      maxAddFee && (!feeValue.amount || feeValue.amount > maxAddFee)
        ? maxAddFee
        : feeValue.amount,
    [maxAddFee, feeValue]
  );

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return null;

    return localAsset.type === TempleAssetType.TEZ
      ? (() => {
          let ma =
            acc.type === TempleAccountType.ManagedKT
              ? new BigNumber(balanceNum)
              : new BigNumber(balanceNum)
                  .minus(baseFee)
                  .minus(safeFeeValue ?? 0)
                  .minus(PENNY);
          const maxAmountTez = BigNumber.max(ma, 0);
          const maxAmountUsd = tezPrice
            ? new BigNumber(
                maxAmountTez
                  .multipliedBy(tezPrice)
                  .toFormat(2, BigNumber.ROUND_FLOOR, { decimalSeparator: "." })
              )
            : new BigNumber(0);
          return shouldUseUsd ? maxAmountUsd : maxAmountTez;
        })()
      : new BigNumber(balanceNum);
  }, [
    acc.type,
    localAsset.type,
    balanceNum,
    baseFee,
    safeFeeValue,
    shouldUseUsd,
    tezPrice,
  ]);

  const maxAmountNum = useMemo(
    () => (maxAmount instanceof BigNumber ? maxAmount.toNumber() : maxAmount),
    [maxAmount]
  );

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t("required");
      if (!isKTAddress(toValue) && v === 0) {
        return t("amountMustBePositive");
      }
      if (!maxAmountNum) return true;
      const maxAmount = new BigNumber(maxAmountNum);
      const vBN = new BigNumber(v);
      return (
        vBN.isLessThanOrEqualTo(maxAmount) ||
        t("maximalAmount", toLocalFixed(maxAmount))
      );
    },
    [maxAmountNum, toValue]
  );

  const handleFeeFieldChange = useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  useEffect(() => {
    if (formState.dirtyFields.has("amount")) {
      triggerValidation("amount");
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountNum]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue("amount", maxAmount.toNumber());
      triggerValidation("amount");
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleAmountFieldFocus = useCallback((evt) => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const [submitError, setSubmitError] = useSafeState<any>(
    null,
    `${tezos.checksum}_${toResolved}`
  );

  const toTEZAmount = useCallback(
    (usdAmount: number) =>
      +new BigNumber(usdAmount)
        .dividedBy(tezPrice ?? 1)
        .toFormat(6, BigNumber.ROUND_FLOOR, {
          decimalSeparator: ".",
        }),
    [tezPrice]
  );

  const validateRecipient = useCallback(
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

  const onSubmit = useCallback(
    async ({ amount, fee: feeVal }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);

      if (feeVal.inToken) {
        console.log(amount, feeVal);
        return;
      }

      formAnalytics.trackSubmit();
      try {
        let op: WalletOperation;
        if (isKTAddress(acc.publicKeyHash)) {
          const michelsonLambda = isKTAddress(toResolved)
            ? transferToContract
            : transferImplicit;

          const contract = await loadContract(tezos, acc.publicKeyHash);
          op = await contract.methods
            .do(michelsonLambda(toResolved, tzToMutez(amount)))
            .send({ amount: 0 });
        } else {
          const actualAmount = shouldUseUsd ? toTEZAmount(amount) : amount;
          const transferParams = await toTransferParams(
            tezos,
            localAsset,
            accountPkh,
            toResolved,
            actualAmount
          );
          const estmtn = await tezos.estimate.transfer(transferParams);
          const addFee = tzToMutez(feeVal.amount ?? 0);
          const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
          op = await tezos.wallet
            .transfer({ ...transferParams, fee } as any)
            .send();
        }
        setOperation(op);
        reset({ to: "", fee: defaultFeeValue });

        formAnalytics.trackSubmitSuccess();
      } catch (err) {
        formAnalytics.trackSubmitFail();

        if (err.message === "Declined") {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setSubmitError(err);
      }
    },
    [
      acc,
      formState.isSubmitting,
      tezos,
      localAsset,
      setSubmitError,
      setOperation,
      reset,
      accountPkh,
      toResolved,
      shouldUseUsd,
      toTEZAmount,
      formAnalytics,
    ]
  );

  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const estimateFallbackDisplayed = toFilled && !baseFee && estimating;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={<NoSpaceField ref={toFieldRef} />}
        control={control}
        rules={{
          validate: validateRecipient,
        }}
        onChange={([v]) => v}
        onFocus={() => toFieldRef.current?.focus()}
        textarea
        rows={2}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t("recipient")}
        labelDescription={
          filledAccount ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                type="bottts"
                hash={filledAccount.publicKeyHash}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">{filledAccount.name}</div>{" "}
              (
              <Balance asset={localAsset} address={filledAccount.publicKeyHash}>
                {(bal) => (
                  <span className={classNames("text-xs leading-none")}>
                    <Money>{bal}</Money>{" "}
                    <span style={{ fontSize: "0.75em" }}>
                      {localAsset.symbol}
                    </span>
                  </span>
                )}
              </Balance>
              )
            </div>
          ) : (
            <T
              id={
                canUseDomainNames
                  ? "tokensRecepientInputDescriptionWithDomain"
                  : "tokensRecepientInputDescription"
              }
              substitutions={localAsset.symbol}
            />
          )
        }
        placeholder={t(
          canUseDomainNames
            ? "recipientInputPlaceholderWithDomain"
            : "recipientInputPlaceholder"
        )}
        errorCaption={errors.to?.message}
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

      <Controller
        name="amount"
        as={
          <AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} />
        }
        control={control}
        rules={{
          validate: validateAmount,
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="send-amount"
        assetSymbol={
          canToggleUsd ? (
            <button
              type="button"
              onClick={handleUsdToggle}
              className={classNames(
                "px-1 rounded-md",
                "flex items-center",
                "font-light",
                "hover:bg-black hover:bg-opacity-5",
                "trasition ease-in-out duration-200",
                "cursor-pointer pointer-events-auto"
              )}
            >
              {shouldUseUsd ? "USD" : localAsset.symbol}
              <div className="ml-1 h-4 flex flex-col justify-between">
                <ChevronUpIcon className="h-2 w-auto stroke-current stroke-2" />
                <ChevronDownIcon className="h-2 w-auto stroke-current stroke-2" />
              </div>
            </button>
          ) : (
            localAsset.symbol
          )
        }
        assetDecimals={shouldUseUsd ? 2 : localAsset.decimals}
        label={t("amount")}
        labelDescription={
          restFormDisplayed &&
          maxAmount && (
            <>
              <T id="availableToSend" />{" "}
              <button
                type="button"
                className={classNames("underline")}
                onClick={handleSetMaxAmount}
              >
                {shouldUseUsd ? <span className="pr-px">$</span> : null}
                {toLocalFixed(maxAmount)}
              </button>
              {amountValue && localAsset.type === TempleAssetType.TEZ ? (
                <>
                  <br />
                  {shouldUseUsd ? (
                    <div className="mt-1 -mb-3">
                      ≈{" "}
                      <span className="font-normal text-gray-700">
                        {toTEZAmount(amountValue)}
                      </span>{" "}
                      <T id="inXTZ" />
                    </div>
                  ) : (
                    <InUSD
                      volume={amountValue}
                      roundingMode={BigNumber.ROUND_FLOOR}
                    >
                      {(usdAmount) => (
                        <div className="mt-1 -mb-3">
                          ≈{" "}
                          <span className="font-normal text-gray-700">
                            <span className="pr-px">$</span>
                            {usdAmount}
                          </span>{" "}
                          <T id="inUSD" />
                        </div>
                      )}
                    </InUSD>
                  )}
                </>
              ) : null}
            </>
          )
        }
        placeholder={t("amountPlaceholder")}
        errorCaption={restFormDisplayed && errors.amount?.message}
        containerClassName="mb-4"
        autoFocus={Boolean(maxAmount)}
      />

      {estimateFallbackDisplayed ? (
        <SpinnerSection />
      ) : restFormDisplayed ? (
        <>
          {(() => {
            switch (true) {
              case Boolean(submitError):
                return <SendErrorAlert type="submit" error={submitError} />;

              case Boolean(estimationError):
                return (
                  <SendErrorAlert type="estimation" error={estimationError} />
                );

              case toResolved === accountPkh:
                return (
                  <Alert
                    type="warn"
                    title={t("attentionExclamation")}
                    description={<T id="tryingToTransferToYourself" />}
                    className="mt-6 mb-4"
                  />
                );

              default:
                return null;
            }
          })()}

          <AdditionalFeeInput
            name="fee"
            control={control}
            onChange={handleFeeFieldChange}
            assetSymbol={TEZ_ASSET.symbol}
            baseFee={baseFee}
            token={canPayFeeInTokens ? (localAsset as TempleToken) : undefined}
            tokenPrice={gasTokenPrice ?? undefined}
            error={errors.fee as any}
            id="send-fee"
          />

          <T id="send">
            {(message) => (
              <FormSubmitButton
                loading={formState.isSubmitting}
                disabled={Boolean(estimationError)}
              >
                {message}
              </FormSubmitButton>
            )}
          </T>
        </>
      ) : (
        allAccounts.length > 1 && (
          <div className={classNames("mt-8 mb-6", "flex flex-col")}>
            <h2
              className={classNames("mb-4", "leading-tight", "flex flex-col")}
            >
              <T id="sendToMyAccounts">
                {(message) => (
                  <span className="text-base font-semibold text-gray-700">
                    {message}
                  </span>
                )}
              </T>

              <T id="clickOnRecipientAccount">
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
                "border",
                "flex flex-col",
                "text-gray-700 text-sm leading-tight"
              )}
            >
              {allAccounts
                .filter((acc) => acc.publicKeyHash !== accountPkh)
                .map((acc, i, arr) => {
                  const last = i === arr.length - 1;
                  const handleAccountClick = () => {
                    setValue("to", acc.publicKeyHash);
                    triggerValidation("to");
                  };

                  return (
                    <Button
                      key={acc.publicKeyHash}
                      type="button"
                      className={classNames(
                        "relative",
                        "block w-full",
                        "overflow-hidden",
                        !last && "border-b border-gray-200",
                        "hover:bg-gray-100 focus:bg-gray-100",
                        "flex items-center p-2",
                        "text-gray-700",
                        "transition ease-in-out duration-200",
                        "focus:outline-none",
                        "opacity-90 hover:opacity-100"
                      )}
                      onClick={handleAccountClick}
                      testID={SendFormSelectors.MyAccountItemButton}
                    >
                      <Identicon
                        type="bottts"
                        hash={acc.publicKeyHash}
                        size={32}
                        className="flex-shrink-0 shadow-xs"
                      />

                      <div className="flex flex-col items-start ml-2">
                        <div className="flex flex-wrap items-center">
                          <Name className="text-sm font-medium leading-tight">
                            {acc.name}
                          </Name>

                          <AccountTypeBadge account={acc} />
                        </div>

                        <div className="flex flex-wrap items-center mt-1">
                          <div
                            className={classNames(
                              "text-xs leading-none",
                              "text-gray-700"
                            )}
                          >
                            {(() => {
                              const val = acc.publicKeyHash;
                              const ln = val.length;
                              return (
                                <>
                                  {val.slice(0, 7)}
                                  <span className="opacity-75">...</span>
                                  {val.slice(ln - 4, ln)}
                                </>
                              );
                            })()}
                          </div>

                          <Balance
                            asset={localAsset}
                            address={acc.publicKeyHash}
                          >
                            {(bal) => (
                              <div
                                className={classNames(
                                  "ml-2",
                                  "text-xs leading-none",
                                  "text-gray-600"
                                )}
                              >
                                <Money>{bal}</Money>{" "}
                                <span style={{ fontSize: "0.75em" }}>
                                  {localAsset.symbol}
                                </span>
                              </div>
                            )}
                          </Balance>
                        </div>
                      </div>

                      <div
                        className={classNames(
                          "absolute right-0 top-0 bottom-0",
                          "flex items-center",
                          "pr-2",
                          "text-gray-500"
                        )}
                      >
                        <ChevronRightIcon className="h-5 w-auto stroke-current" />
                      </div>
                    </Button>
                  );
                })}
            </div>
          </div>
        )
      )}
    </form>
  );
};

type SendErrorAlertProps = {
  type: "submit" | "estimation";
  error: Error;
};

const SendErrorAlert: FC<SendErrorAlertProps> = ({ type, error }) => (
  <Alert
    type={type === "submit" ? "error" : "warn"}
    title={(() => {
      switch (true) {
        case error instanceof NotEnoughFundsError:
          return error instanceof ZeroTEZBalanceError
            ? `${t("notEnoughCurrencyFunds", "ꜩ")} 😶`
            : `${t("notEnoughFunds")} 😶`;

        default:
          return t("failed");
      }
    })()}
    description={(() => {
      switch (true) {
        case error instanceof ZeroBalanceError:
          return t("yourBalanceIsZero");

        case error instanceof ZeroTEZBalanceError:
          return t("mainAssetBalanceIsZero");

        case error instanceof NotEnoughFundsError:
          return t("minimalFeeGreaterThanBalanceVerbose");

        default:
          return (
            <>
              <T
                id={
                  type === "submit"
                    ? "unableToSendTransactionAction"
                    : "unableToEstimateTransactionAction"
                }
              />
              <br />
              <T id="thisMayHappenBecause" />
              <ul className="mt-1 ml-2 text-xs list-disc list-inside">
                <T id="minimalFeeGreaterThanBalanceVerbose">
                  {(message) => <li>{message}</li>}
                </T>
                <T id="networkOrOtherIssue">
                  {(message) => <li>{message}</li>}
                </T>
              </ul>
            </>
          );
      }
    })()}
    autoFocus
    className={classNames("mt-6 mb-4")}
  />
);

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

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner className="w-20" />
  </div>
);
