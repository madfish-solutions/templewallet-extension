import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, WalletOperation } from "@taquito/taquito";
import type { Estimate } from "@taquito/taquito/dist/types/contract/estimate";
import {
  ThanosAsset,
  XTZ_ASSET,
  useRelevantAccounts,
  useAccount,
  useTezos,
  useCurrentAsset,
  useBalance,
  useDelegate,
  useTezosDomainsClient,
  fetchBalance,
  toTransferParams,
  tzToMutez,
  mutezToTz,
  isAddressValid,
  toPenny,
  hasManager,
  ThanosAssetType,
  ThanosChainId,
  isKTAddress,
  isDomainNameValid,
  ThanosAccountType,
  loadContract,
  useChainId,
} from "lib/thanos/front";
import { transferImplicit, transferToContract } from "lib/michelson";
import useSafeState from "lib/ui/useSafeState";
import { T, t } from "lib/i18n/react";
import {
  ArtificialError,
  NotEnoughFundsError,
  ZeroBalanceError,
  ZeroXTZBalanceError,
} from "app/defaults";
import { useAppEnv } from "app/env";
import AssetSelect from "app/templates/AssetSelect";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import OperationStatus from "app/templates/OperationStatus";
import Spinner from "app/atoms/Spinner";
import Money from "app/atoms/Money";
import NoSpaceField from "app/atoms/NoSpaceField";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import AccountTypeBadge from "app/atoms/AccountTypeBadge";
import Alert from "app/atoms/Alert";
import AdditionalFeeInput from "./AdditionalFeeInput";

interface FormData {
  to: string;
  amount: number;
  fee: number;
}

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;

const SendForm: React.FC = () => {
  const { currentAsset } = useCurrentAsset();
  const tezos = useTezos();

  const [localAsset, setLocalAsset] = useSafeState(
    currentAsset,
    tezos.checksum
  );
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);

  return (
    <>
      {operation && (
        <OperationStatus typeTitle={t("transaction")} operation={operation} />
      )}

      <AssetSelect
        value={localAsset}
        onChange={setLocalAsset}
        className="mb-6"
      />

      <React.Suspense fallback={<SpinnerSection />}>
        <Form localAsset={localAsset} setOperation={setOperation} />
      </React.Suspense>
    </>
  );
};

export default SendForm;

type FormProps = {
  localAsset: ThanosAsset;
  setOperation: React.Dispatch<any>;
};

const Form: React.FC<FormProps> = ({ localAsset, setOperation }) => {
  const { registerBackHandler } = useAppEnv();

  const allAccounts = useRelevantAccounts();
  const acc = useAccount();
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();

  const canUseDomainNames = domainsClient.isSupported;
  const accountPkh = acc.publicKeyHash;

  const { data: balanceData, mutate: mutateBalance } = useBalance(
    localAsset,
    accountPkh
  );
  const balance = balanceData!;
  const balanceNum = balance.toNumber();

  const { data: xtzBalanceData, mutate: mutateXtzBalance } = useBalance(
    XTZ_ASSET,
    accountPkh
  );
  const xtzBalance = xtzBalanceData!;
  const xtzBalanceNum = xtzBalance.toNumber();

  const { data: myBakerPkh } = useDelegate(accountPkh);

  const lazyChainId = useChainId();
  const deplhiNetwork = React.useMemo(
    () =>
      lazyChainId === ThanosChainId.Delphinet ||
      lazyChainId === ThanosChainId.Mainnet,
    [lazyChainId]
  );

  const storageUsedRef = React.useRef(false);

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
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      fee: RECOMMENDED_ADD_FEE,
    },
  });

  const toValue = watch("to");
  const amountValue = watch("amount");
  const feeValue = watch("fee") ?? RECOMMENDED_ADD_FEE;

  const toFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = React.useRef<HTMLInputElement>(null);

  const toFilledWithAddress = React.useMemo(
    () => Boolean(toValue && isAddressValid(toValue)),
    [toValue]
  );

  const toFilledWithDomain = React.useMemo(
    () => toValue && isDomainNameValid(toValue, domainsClient),
    [toValue, domainsClient]
  );

  const domainAddressFactory = React.useCallback(
    (_k: string, _checksum: string, toValue: string) =>
      domainsClient.resolver.resolveNameToAddress(toValue),
    [domainsClient]
  );
  const { data: resolvedAddress } = useSWR(
    ["tzdns-address", tezos.checksum, toValue],
    domainAddressFactory,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const toFilled = React.useMemo(
    () => (resolvedAddress ? toFilledWithDomain : toFilledWithAddress),
    [toFilledWithAddress, toFilledWithDomain, resolvedAddress]
  );

  const toResolved = React.useMemo(() => resolvedAddress || toValue, [
    resolvedAddress,
    toValue,
  ]);

  const filledAccount = React.useMemo(
    () =>
      (toResolved && allAccounts.find((a) => a.publicKeyHash === toResolved)) ||
      null,
    [allAccounts, toResolved]
  );

  const cleanToField = React.useCallback(() => {
    setValue("to", "");
    triggerValidation("to");
  }, [setValue, triggerValidation]);

  React.useLayoutEffect(() => {
    if (toFilled) {
      return registerBackHandler(() => {
        cleanToField();
        window.scrollTo(0, 0);
      });
    }
    return;
  }, [toFilled, registerBackHandler, cleanToField]);

  const estimateBaseFee = React.useCallback(async () => {
    try {
      const to = toResolved;
      const xtz = localAsset.symbol === ThanosAssetType.XTZ;

      const balanceBN = (await mutateBalance(
        fetchBalance(tezos, localAsset, accountPkh)
      ))!;
      if (balanceBN.isZero()) {
        throw new ZeroBalanceError();
      }

      let xtzBalanceBN: BigNumber;
      if (!xtz) {
        xtzBalanceBN = (await mutateXtzBalance(
          fetchBalance(tezos, XTZ_ASSET, accountPkh)
        ))!;
        if (xtzBalanceBN.isZero()) {
          throw new ZeroXTZBalanceError();
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
          acc.type === ThanosAccountType.ManagedKT ? acc.owner : accountPkh
        ),
      ]);

      let estmtnMax: Estimate;
      if (acc.type === ThanosAccountType.ManagedKT) {
        const michelsonLambda = isKTAddress(to)
          ? transferToContract
          : transferImplicit;

        const contract = await loadContract(tezos, acc.publicKeyHash);
        const transferParams = contract.methods
          .do(michelsonLambda(to, tzToMutez(balanceBN)))
          .toTransferParams();
        estmtnMax = await tezos.estimate.transfer(transferParams);
      } else if (xtz) {
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

      if (estmtnMax.storageLimit > 0) {
        storageUsedRef.current = true;
      }

      let baseFee = mutezToTz(estmtnMax.totalCost);
      if (!hasManager(manager)) {
        baseFee = baseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (
        xtz
          ? baseFee.isGreaterThanOrEqualTo(balanceBN)
          : baseFee.isGreaterThan(xtzBalanceBN!)
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
    mutateXtzBalance,
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

  const maxAddFee = React.useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(xtzBalanceNum)
        .minus(baseFee)
        .minus(PENNY)
        .toNumber();
    }
    return;
  }, [xtzBalanceNum, baseFee]);

  const safeFeeValue = React.useMemo(
    () => (maxAddFee && feeValue > maxAddFee ? maxAddFee : feeValue),
    [maxAddFee, feeValue]
  );

  const maxAmount = React.useMemo(() => {
    if (!(baseFee instanceof BigNumber)) return null;

    return localAsset.type === ThanosAssetType.XTZ
      ? (() => {
          let ma =
            acc.type === ThanosAccountType.ManagedKT
              ? new BigNumber(balanceNum)
              : new BigNumber(balanceNum)
                  .minus(baseFee)
                  .minus(safeFeeValue ?? 0);
          if (myBakerPkh || (deplhiNetwork && storageUsedRef.current)) {
            ma = ma.minus(PENNY);
          }
          return BigNumber.max(ma, 0);
        })()
      : new BigNumber(balanceNum);
  }, [
    acc.type,
    localAsset.type,
    balanceNum,
    baseFee,
    safeFeeValue,
    myBakerPkh,
    deplhiNetwork,
  ]);

  const maxAmountNum = React.useMemo(
    () => (maxAmount instanceof BigNumber ? maxAmount.toNumber() : maxAmount),
    [maxAmount]
  );

  const validateAmount = React.useCallback(
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
        t("maximalAmount", maxAmount.toFixed())
      );
    },
    [maxAmountNum, toValue]
  );

  const handleFeeFieldChange = React.useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  React.useEffect(() => {
    if (formState.dirtyFields.has("amount")) {
      triggerValidation("amount");
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountNum]);

  const handleSetMaxAmount = React.useCallback(() => {
    if (maxAmount) {
      setValue("amount", maxAmount.toNumber());
      triggerValidation("amount");
    }
  }, [setValue, maxAmount, triggerValidation]);

  const [submitError, setSubmitError] = useSafeState<any>(
    null,
    `${tezos.checksum}_${toResolved}`
  );

  const validateRecipient = React.useCallback(
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
          return `Domain "${value}" doesn't resolve to an address`;
        }

        value = resolved;
      }

      return isAddressValid(value) ? true : "Invalid address or domain name";
    },
    [canUseDomainNames, domainsClient]
  );

  const onSubmit = React.useCallback(
    async ({ amount, fee: feeVal }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);

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
          const transferParams = await toTransferParams(
            tezos,
            localAsset,
            accountPkh,
            toResolved,
            amount
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
      } catch (err) {
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
          <span className="mr-1 whitespace-no-wrap">Resolved address:</span>
          <span className="font-normal">{resolvedAddress}</span>
        </div>
      )}

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

          <Controller
            name="amount"
            as={<AssetField ref={amountFieldRef} />}
            control={control}
            rules={{
              validate: validateAmount,
            }}
            onChange={([v]) => v}
            onFocus={() => amountFieldRef.current?.focus()}
            id="send-amount"
            assetSymbol={localAsset.symbol}
            assetDecimals={localAsset.decimals}
            label={t("amount")}
            labelDescription={
              maxAmount && (
                <>
                  <T id="availableToSend" />{" "}
                  <button
                    type="button"
                    className={classNames("underline")}
                    onClick={handleSetMaxAmount}
                  >
                    {maxAmount.toFixed()}
                  </button>
                  {amountValue && localAsset.type === ThanosAssetType.XTZ ? (
                    <>
                      <br />
                      <InUSD volume={amountValue}>
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
                    </>
                  ) : null}
                </>
              )
            }
            placeholder={t("amountPlaceholder")}
            errorCaption={errors.amount?.message}
            containerClassName="mb-4"
            autoFocus={Boolean(maxAmount)}
          />

          <AdditionalFeeInput
            name="fee"
            control={control}
            onChange={handleFeeFieldChange}
            assetSymbol={XTZ_ASSET.symbol}
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
      ) : (
        allAccounts.length > 1 && (
          <div className={classNames("my-6", "flex flex-col")}>
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
                "border-2 bg-gray-100",
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
                    <button
                      key={acc.publicKeyHash}
                      type="button"
                      className={classNames(
                        "block w-full",
                        "overflow-hidden",
                        !last && "border-b border-gray-200",
                        "hover:bg-gray-200 focus:bg-gray-200",
                        "flex items-center",
                        "text-gray-700",
                        "transition ease-in-out duration-200",
                        "focus:outline-none",
                        "opacity-90 hover:opacity-100"
                      )}
                      style={{
                        padding: "0.4rem 0.375rem 0.4rem 0.375rem",
                      }}
                      onClick={handleAccountClick}
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
                    </button>
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

const SendErrorAlert: React.FC<SendErrorAlertProps> = ({ type, error }) => (
  <Alert
    type={type === "submit" ? "error" : "warn"}
    title={(() => {
      switch (true) {
        case error instanceof NotEnoughFundsError:
          return error instanceof ZeroXTZBalanceError
            ? t("notEnoughCurrencyFunds", "XTZ")
            : t("notEnoughFunds");

        default:
          return t("failed");
      }
    })()}
    description={(() => {
      switch (true) {
        case error instanceof ZeroBalanceError:
          return t("yourBalanceIsZero");

        case error instanceof ZeroXTZBalanceError:
          return t("mainAssetBalanceIsZero");

        case error instanceof NotEnoughFundsError:
          return t("minimalFeeGreaterThanBalanceVerbose");

        default:
          return (
            <>
              <T
                id="unableToPerformTransactionAction"
                substitutions={t(
                  type === "submit" ? "send" : "estimate"
                ).toLowerCase()}
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

const SpinnerSection: React.FC = () => (
  <div className="flex justify-center my-8">
    <Spinner className="w-20" />
  </div>
);
