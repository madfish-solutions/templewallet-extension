import React, {
  ComponentProps,
  Dispatch,
  FC,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useRef,
  memo,
} from "react";

import { DEFAULT_FEE, WalletOperation } from "@taquito/taquito";
import type { Estimate } from "@taquito/taquito/dist/types/contract/estimate";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";

import Alert from "app/atoms/Alert";
import AssetField from "app/atoms/AssetField";
import { Button } from "app/atoms/Button";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import HashShortView from "app/atoms/HashShortView";
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
import { ReactComponent as ChevronUpIcon } from "app/icons/chevron-up.svg";
import { ReactComponent as ContactBookIcon } from "app/icons/contact-book.svg";
import AdditionalFeeInput from "app/templates/AdditionalFeeInput";
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
  useTezos,
  useTezosDomainsClient,
  useNetwork,
  useAssetUSDPrice,
  useContacts,
  TempleContact,
  searchContacts,
} from "lib/temple/front";
import useSafeState from "lib/ui/useSafeState";
import { navigate, HistoryAction } from "lib/woozie";

import { SendFormSelectors } from "./SendForm.selectors";

interface FormData {
  to: string;
  amount: string;
  fee: number;
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

const Form: FC<FormProps> = ({ localAsset, setOperation }) => {
  const { registerBackHandler } = useAppEnv();
  const assetPrice = useAssetUSDPrice(localAsset);

  const { allContacts } = useContacts();
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

  const { data: tezBalanceData, mutate: mutateTezBalance } = useBalance(
    TEZ_ASSET,
    accountPkh
  );
  const tezBalance = tezBalanceData!;

  const [shouldUseUsd, setShouldUseUsd] = useSafeState(false);

  const canToggleUsd = network.type === "main" && assetPrice !== null;
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
      fee: RECOMMENDED_ADD_FEE,
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
        (newShouldUseUsd
          ? amount.multipliedBy(assetPrice!)
          : amount.div(assetPrice!)
        ).toFormat(newShouldUseUsd ? 2 : 6, BigNumber.ROUND_FLOOR, {
          decimalSeparator: ".",
        })
      );
    },
    [setShouldUseUsd, shouldUseUsd, getValues, assetPrice, setValue]
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
  const feeValue = watch("fee") ?? RECOMMENDED_ADD_FEE;

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

  const toFilled = useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = useMemo(
    () => resolvedAddress || toValue,
    [resolvedAddress, toValue]
  );

  const toFilledWithKTAddress = useMemo(
    () => isAddressValid(toResolved) && isKTAddress(toResolved),
    [toResolved]
  );

  const filledContact = useMemo(
    () =>
      (toResolved && allContacts.find((c) => c.address === toResolved)) || null,
    [allContacts, toResolved]
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
          amount: amountMax.toString() as any,
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
    tezos,
    localAsset,
    accountPkh,
    toResolved,
    mutateBalance,
    mutateTezBalance,
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
    if (baseFee instanceof BigNumber) {
      return tezBalance.minus(baseFee).minus(PENNY).toNumber();
    }
    return;
  }, [tezBalance, baseFee]);

  const safeFeeValue = useMemo(
    () => (maxAddFee && feeValue > maxAddFee ? maxAddFee : feeValue),
    [maxAddFee, feeValue]
  );

  const maxAmount = useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return null;

    const maxAmountAsset =
      localAsset.type === TempleAssetType.TEZ
        ? BigNumber.max(
            acc.type === TempleAccountType.ManagedKT
              ? balance
              : balance
                  .minus(baseFee)
                  .minus(safeFeeValue ?? 0)
                  .minus(PENNY),
            0
          )
        : balance;
    const maxAmountUsd = assetPrice
      ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
      : new BigNumber(0);
    return shouldUseUsd ? maxAmountUsd : maxAmountAsset;
  }, [
    acc.type,
    localAsset.type,
    balance,
    baseFee,
    safeFeeValue,
    shouldUseUsd,
    assetPrice,
  ]);

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t("required");
      if (!isKTAddress(toValue) && v === 0) {
        return t("amountMustBePositive");
      }
      if (!maxAmount) return true;
      const vBN = new BigNumber(v);
      return (
        vBN.isLessThanOrEqualTo(maxAmount) ||
        t("maximalAmount", toLocalFixed(maxAmount))
      );
    },
    [maxAmount, toValue]
  );

  const handleFeeFieldChange = useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.has("amount")) {
      triggerValidation("amount");
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountStr]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue("amount", maxAmount.toString());
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

  const toAssetAmount = useCallback(
    (usdAmount: BigNumber.Value) =>
      new BigNumber(usdAmount)
        .dividedBy(assetPrice ?? 1)
        .toFormat(localAsset.decimals, BigNumber.ROUND_FLOOR, {
          decimalSeparator: ".",
        }),
    [assetPrice, localAsset.decimals]
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
          const actualAmount = shouldUseUsd ? toAssetAmount(amount) : amount;
          const transferParams = await toTransferParams(
            tezos,
            localAsset,
            accountPkh,
            toResolved,
            actualAmount
          );
          const estmtn = await tezos.estimate.transfer(transferParams);
          const addFee = tzToMutez(feeVal ?? 0);
          const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
          op = await tezos.wallet
            .transfer({ ...transferParams, fee } as any)
            .send();
        }
        setOperation(op);
        reset({ to: "", fee: RECOMMENDED_ADD_FEE });

        formAnalytics.trackSubmitSuccess();
        // onAddressUsage(toResolved);
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
      toAssetAmount,
      formAnalytics,
      // onAddressUsage,
    ]
  );

  const handleAccountSelect = useCallback(
    (accountPkh: string) => {
      setValue("to", accountPkh);
      triggerValidation("to");
    },
    [setValue, triggerValidation]
  );

  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const estimateFallbackDisplayed = toFilled && !baseFee && estimating;

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
  }, [setToFieldFocused]);

  const allContactsWithoutCurrent = useMemo(
    () => allContacts.filter((c) => c.address !== accountPkh),
    [allContacts, accountPkh]
  );

  return (
    <form style={{ minHeight: "24rem" }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={
          <NoSpaceField
            ref={toFieldRef}
            onFocus={handleToFieldFocus}
            dropdownInner={
              <ContactsDropdown
                contacts={allContactsWithoutCurrent}
                opened={!toFilled ? toFieldFocused : false}
                onSelect={handleAccountSelect}
                searchTerm={toValue}
              />
            }
          />
        }
        control={control}
        rules={{
          validate: validateRecipient,
        }}
        onChange={([v]) => v}
        onBlur={handleToFieldBlur}
        textarea
        rows={2}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t("recipient")}
        labelDescription={
          filledContact ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                type="bottts"
                hash={filledContact.address}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">{filledContact.name}</div>{" "}
              (
              <Balance asset={localAsset} address={filledContact.address}>
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
        errorCaption={!toFieldFocused ? errors.to?.message : null}
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
              {amountValue ? (
                <>
                  <br />
                  {shouldUseUsd ? (
                    <div className="mt-1 -mb-3">
                      ≈{" "}
                      <span className="font-normal text-gray-700">
                        {toAssetAmount(amountValue)}
                      </span>{" "}
                      <T
                        id="inAsset"
                        substitutions={
                          localAsset.type === TempleAssetType.TEZ
                            ? "ꜩ"
                            : localAsset.symbol
                        }
                      />
                    </div>
                  ) : (
                    <InUSD
                      asset={localAsset}
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

              case toFilledWithKTAddress:
                return (
                  <Alert
                    type="warn"
                    title={t("attentionExclamation")}
                    description={<T id="tryingToTransferToContract" />}
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
            error={errors.fee}
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
      ) : null}
    </form>
  );
};

type ContactsDropdownProps = {
  contacts: TempleContact[];
  opened: boolean;
  onSelect: (address: string) => void;
  searchTerm: string;
};

const ContactsDropdown = memo<ContactsDropdownProps>(
  ({ contacts, opened, onSelect, searchTerm }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const filteredContacts = useMemo(
      () => (searchTerm ? searchContacts(contacts, searchTerm) : contacts),
      [contacts, searchTerm]
    );

    const activeItem = useMemo(
      () => (activeIndex !== null ? filteredContacts[activeIndex] : null),
      [filteredContacts, activeIndex]
    );

    useEffect(() => {
      setActiveIndex((i) => (searchTerm ? (i !== null ? i : 0) : i));
    }, [setActiveIndex, searchTerm]);

    useEffect(() => {
      if (!opened) {
        setActiveIndex(null);
      }
    }, [setActiveIndex, opened]);

    useEffect(() => {
      if (activeIndex !== null && activeIndex >= filteredContacts.length) {
        setActiveIndex(null);
      }
    }, [setActiveIndex, activeIndex, filteredContacts.length]);

    useEffect(() => {
      const handleKeyup = (evt: KeyboardEvent) => {
        switch (evt.key) {
          case "Enter":
            if (activeItem) {
              onSelect(activeItem.address);
              (document.activeElement as any)?.blur();
            }
            break;

          case "ArrowDown":
            setActiveIndex((i) => (i !== null ? i + 1 : 0));
            break;

          case "ArrowUp":
            setActiveIndex((i) => (i !== null ? (i > 0 ? i - 1 : 0) : i));
            break;
        }
      };

      window.addEventListener("keyup", handleKeyup);
      return () => window.removeEventListener("keyup", handleKeyup);
    }, [activeItem, setActiveIndex, onSelect]);

    return (
      <DropdownWrapper
        scaleAnimation={false}
        opened={opened}
        className={classNames(
          "absolute left-0 right-0",
          "origin-top overflow-x-hidden overflow-y-auto",
          "z-50"
        )}
        style={{
          top: "100%",
          maxHeight: "11rem",
          backgroundColor: "white",
          borderColor: "#e2e8f0",
          padding: 0,
        }}
      >
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <ContactsDropdownItem
              key={contact.address}
              contact={contact}
              active={contact.address === activeItem?.address}
              onClick={() => onSelect(contact.address)}
            />
          ))
        ) : (
          <div
            className={classNames(
              "flex items-center justify-center my-6",
              "text-gray-600 text-base font-light"
            )}
          >
            <ContactBookIcon className="w-5 h-auto mr-1 stroke-current" />
            <span>
              <T id="noContactsFound" />
            </span>
          </div>
        )}
      </DropdownWrapper>
    );
  }
);

type ContactsDropdownItemProps = ComponentProps<typeof Button> & {
  contact: TempleContact;
  active?: boolean;
};

const ContactsDropdownItem: FC<ContactsDropdownItemProps> = ({
  contact,
  active,
  ...rest
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [active]);

  return (
    <Button
      ref={ref}
      type="button"
      testID={SendFormSelectors.ContactItemButton}
      className={classNames(
        "w-full flex items-center",
        "p-2 text-left",
        active ? "bg-gray-100" : "hover:bg-gray-100 focus:bg-gray-100"
      )}
      {...rest}
    >
      <Identicon
        type="bottts"
        hash={contact.address}
        size={32}
        className="flex-shrink-0 shadow-xs"
      />

      <div className="ml-3 flex flex-1 w-full">
        <div className="flex flex-col justify-between flex-1">
          <Name className="mb-px text-sm font-medium leading-tight text-left">
            {contact.name}
          </Name>

          <span
            className={classNames(
              "text-xs font-light leading-tight text-gray-600"
            )}
          >
            <HashShortView hash={contact.address} />
          </span>
        </div>

        {contact.accountInWallet ? (
          <div className="flex items-center">
            <span
              className={classNames(
                "mx-1",
                "rounded-sm",
                "border border-opacity-25",
                "px-1 py-px",
                "leading-tight",
                "text-opacity-50",
                "border-black text-black"
              )}
              style={{ fontSize: "0.6rem" }}
            >
              <T id="ownAccount" />
            </span>
          </div>
        ) : null}
      </div>
    </Button>
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
