import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR, { mutate } from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, Tezos } from "@taquito/taquito";
import { ValidationResult, validateAddress } from "@taquito/utils";
import {
  ThanosAccountType,
  useReadyThanos,
  useBalance,
  fetchBalance,
  getBalanceSWRKey
} from "lib/thanos/front";
import useSafeState from "lib/ui/useSafeState";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import Spinner from "app/atoms/Spinner";
import Money from "app/atoms/Money";
import NoSpaceField from "app/atoms/NoSpaceField";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import Alert from "app/atoms/Alert";
import HashChip from "app/atoms/HashChip";
import xtzImgUrl from "app/misc/xtz.png";

interface FormData {
  to: string;
  amount: number;
  fee: number;
}

const MIN_AMOUNT = 0.000001;
const RECOMMENDED_ADD_FEE = 100;
const NOT_ENOUGH_FUNDS = Symbol("NOT_ENOUGH_FUNDS");

const SendForm: React.FC = () => {
  const { accountPkh, allAccounts, tezos, tezosKey } = useReadyThanos();

  const assetSymbol = "XTZ";

  const balSWR = useBalance(accountPkh, true);
  const balance = balSWR.data!;
  const balanceNum = balance.toNumber();

  const validateAddress = React.useCallback(
    (v: any) => isAddressValid(v) || "Invalid address",
    []
  );

  const recommendedAddFeeTz = React.useMemo(
    () => mutezToTz(RECOMMENDED_ADD_FEE).toNumber(),
    []
  );

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
    reset
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: { fee: recommendedAddFeeTz }
  });

  const amountFieldDirty = formState.dirtyFields.has("amount");

  const toValue = watch("to");
  const amountValue = watch("amount");
  const feeValue = watch("fee", recommendedAddFeeTz as any);

  const toFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const amountFieldRef = React.useRef<HTMLInputElement>(null);
  const feeFieldRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (formState.isSubmitted) {
      const firstInvlaid = [
        [errors.to, toFieldRef],
        [errors.amount, amountFieldRef],
        [errors.fee, feeFieldRef]
      ].find(([e]) => e);
      if (firstInvlaid) {
        (firstInvlaid[1] as any).current?.focus();
      }
    }
  }, [formState.isSubmitted, errors.to, errors.amount, errors.fee]);

  const toFilled = React.useMemo(
    () => Boolean(toValue && isAddressValid(toValue)),
    [toValue]
  );

  const filledAccount = React.useMemo(
    () =>
      (toFilled && allAccounts.find(a => a.publicKeyHash === toValue)) || null,
    [toFilled, allAccounts, toValue]
  );

  const estimateBaseFee = React.useCallback(async () => {
    try {
      const balanceBN: BigNumber = await mutate(
        getBalanceSWRKey(accountPkh, tezosKey),
        fetchBalance(accountPkh, tezos)
      );
      if (balanceBN.isZero()) {
        // Human delay
        await new Promise(r => setTimeout(r, 300));
        return NOT_ENOUGH_FUNDS;
      }

      const to = toValue;
      const estmtn = await tezos.estimate.transfer({ to, amount: MIN_AMOUNT });
      let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
      const manager = await tezos.rpc.getManagerKey(accountPkh);
      if (!hasManager(manager)) {
        amountMax = amountMax.minus(mutezToTz(DEFAULT_FEE.REVEAL));
      }
      const estmtnMax = await tezos.estimate.transfer({
        to,
        amount: amountMax.toNumber()
      });

      let baseFee = mutezToTz(estmtnMax.totalCost);
      if (!hasManager(manager)) {
        baseFee = baseFee.plus(mutezToTz(DEFAULT_FEE.REVEAL));
      }

      if (baseFee.isGreaterThanOrEqualTo(balanceBN)) {
        return NOT_ENOUGH_FUNDS;
      }

      return baseFee;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      if (err) {
        return NOT_ENOUGH_FUNDS;
      }

      throw err;
    }
  }, [toValue, tezos, tezosKey, accountPkh]);

  const { data: baseFee, isValidating: estimating } = useSWR(
    () => (toFilled ? ["base-fee", toValue, tezosKey, accountPkh] : null),
    estimateBaseFee,
    {
      dedupingInterval: 30_000
    }
  );

  const maxAmount = React.useMemo(() => {
    if (!baseFee) return null;
    if (baseFee === NOT_ENOUGH_FUNDS) return NOT_ENOUGH_FUNDS;
    const ma = new BigNumber(balanceNum).minus(baseFee).minus(feeValue ?? 0);
    return ma.isGreaterThan(0) ? ma : NOT_ENOUGH_FUNDS;
  }, [balanceNum, baseFee, feeValue]);

  const maxAddFee = React.useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(balanceNum)
        .minus(baseFee)
        .minus(MIN_AMOUNT)
        .toNumber();
    }
  }, [balanceNum, baseFee]);

  const validateAmount = React.useCallback(
    (v: number) => {
      if (maxAmount === NOT_ENOUGH_FUNDS)
        return "Not enough funds for this transaction";
      if (!v) return "Required";
      if (!maxAmount) return true;
      const vBN = new BigNumber(v);
      return (
        vBN.isLessThanOrEqualTo(maxAmount) || `Maximal: ${maxAmount.toString()}`
      );
    },
    [maxAmount]
  );

  const handleFeeFieldChange = React.useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  React.useEffect(() => {
    if (amountFieldDirty) {
      triggerValidation("amount");
    }
  }, [triggerValidation, amountFieldDirty, maxAmount]);

  const handleSetMaxAmount = React.useCallback(() => {
    if (maxAmount && maxAmount !== NOT_ENOUGH_FUNDS) {
      setValue("amount", maxAmount.toNumber());
      triggerValidation("amount");
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleSetRecommendedFee = React.useCallback(() => {
    setValue("fee", recommendedAddFeeTz);
  }, [setValue, recommendedAddFeeTz]);

  const [submitError, setSubmitError] = useSafeState<React.ReactNode>(null);
  const [operation, setOperation] = useSafeState<any>(null);

  const onSubmit = React.useCallback(
    async ({ to, amount, fee: feeVal }: FormData) => {
      try {
        if (formState.isSubmitting) return;
        setSubmitError(null);

        const estmtn = await tezos.estimate.transfer({ to, amount });
        const addFee = tzToMutez(feeVal ?? 0);
        const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
        const op = await tezos.contract.transfer({ to, amount, fee });
        setOperation(op);
        reset({ to: "" });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setSubmitError(err);
      }
    },
    [formState.isSubmitting, tezos, setSubmitError, setOperation, reset]
  );

  const restFormDisplayed = Boolean(toFilled && baseFee);
  const estimateFallbackDisplayed =
    toFilled && (!baseFee || baseFee === NOT_ENOUGH_FUNDS) && estimating;

  return (
    <>
      {operation && <OperationStatus operation={operation} />}

      <form onSubmit={handleSubmit(onSubmit)}>
        {React.useMemo(
          () => (
            <div
              className={classNames(
                "mb-6",
                "border rounded-md",
                "p-2",
                "flex items-center"
              )}
            >
              <img
                src={xtzImgUrl}
                alt={assetSymbol}
                className="h-12 w-auto mr-3"
              />

              <div className="font-light leading-none">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <span className="text-xl text-gray-700">
                      <Money>{balance}</Money>{" "}
                      <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
                    </span>

                    <InUSD volume={balance}>
                      {usdBalance => (
                        <div className="mt-1 text-sm text-gray-500">
                          ${usdBalance}
                        </div>
                      )}
                    </InUSD>
                  </div>
                </div>
              </div>
            </div>
          ),
          [assetSymbol, balance]
        )}

        <Controller
          name="to"
          as={<NoSpaceField ref={toFieldRef} />}
          control={control}
          rules={{
            required: "Required",
            validate: validateAddress
          }}
          onChange={([v]) => v}
          textarea
          rows={2}
          id="send-to"
          label="Recipient address"
          labelDescription={
            filledAccount ? (
              <div className="flex flex-wrap items-center">
                <Identicon
                  type="bottts"
                  hash={filledAccount.publicKeyHash}
                  size={14}
                  className="flex-shrink-0 opacity-75"
                  style={{
                    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.05)"
                  }}
                />
                <div className="ml-1 mr-px font-normal">
                  {filledAccount.name}
                </div>{" "}
                (
                <Balance address={filledAccount.publicKeyHash}>
                  {bal => (
                    <span className={classNames("text-xs leading-none")}>
                      <Money>{bal}</Money>{" "}
                      <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
                    </span>
                  )}
                </Balance>
                )
              </div>
            ) : (
              `Address to send ${assetSymbol} funds to.`
            )
          }
          placeholder="tz1a9w1S7hN5s..."
          errorCaption={errors.to?.message}
          style={{
            resize: "none"
          }}
          containerClassName="mb-4"
        />

        {estimateFallbackDisplayed ? (
          <div className="my-8 flex justify-center">
            <Spinner className="w-20" />
          </div>
        ) : restFormDisplayed ? (
          <>
            {(maxAmount === NOT_ENOUGH_FUNDS || submitError) && (
              <TransferErrorCaption
                type={submitError ? "transfer" : "estimate"}
                zeroBalance={balance.isZero()}
              />
            )}

            <Controller
              name="amount"
              as={<AssetField ref={amountFieldRef} />}
              control={control}
              rules={{
                validate: validateAmount
              }}
              onChange={([v]) => v}
              id="send-amount"
              assetSymbol={assetSymbol}
              label="Amount"
              labelDescription={
                maxAmount &&
                maxAmount !== NOT_ENOUGH_FUNDS && (
                  <>
                    Available to send(max):{" "}
                    <button
                      type="button"
                      className={classNames("underline")}
                      onClick={handleSetMaxAmount}
                    >
                      {maxAmount.toString()}
                    </button>
                    {amountValue ? (
                      <>
                        <br />
                        <InUSD volume={amountValue}>
                          {usdAmount => (
                            <div className="mt-1 -mb-3">
                              ≈{" "}
                              <span className="font-normal text-gray-700">
                                <span className="pr-px">$</span>
                                {usdAmount}
                              </span>{" "}
                              in USD
                            </div>
                          )}
                        </InUSD>
                      </>
                    ) : null}
                  </>
                )
              }
              placeholder="e.g. 123.45"
              errorCaption={errors.amount?.message}
              containerClassName="mb-4"
              autoFocus={maxAmount && maxAmount !== NOT_ENOUGH_FUNDS}
            />

            <Controller
              name="fee"
              as={<AssetField ref={feeFieldRef} />}
              control={control}
              onChange={handleFeeFieldChange}
              id="send-fee"
              assetSymbol={assetSymbol}
              label="Additional Fee"
              labelDescription={
                baseFee instanceof BigNumber && (
                  <>
                    Base Fee for this transaction is:{" "}
                    <span className="font-normal">{baseFee.toString()}</span>
                    <br />
                    Additional - speeds up its confirmation,
                    <br />
                    recommended:{" "}
                    <button
                      type="button"
                      className={classNames("underline")}
                      onClick={handleSetRecommendedFee}
                    >
                      {recommendedAddFeeTz}
                    </button>
                  </>
                )
              }
              placeholder="0"
              errorCaption={errors.fee?.message}
              containerClassName="mb-4"
            />

            <FormSubmitButton
              loading={formState.isSubmitting}
              disabled={formState.isSubmitting}
            >
              Send
            </FormSubmitButton>
          </>
        ) : (
          allAccounts.length > 1 && (
            <div className={classNames("my-6", "flex flex-col")}>
              <h2
                className={classNames("mb-4", "leading-tight", "flex flex-col")}
              >
                <span className="text-base font-semibold text-gray-700">
                  Send to My Accounts
                </span>

                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  Tap to Account you want to send funds to.
                </span>
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
                  .filter(acc => acc.publicKeyHash !== accountPkh)
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
                          padding: "0.4rem 0.375rem 0.4rem 0.375rem"
                        }}
                        onClick={handleAccountClick}
                      >
                        <Identicon
                          type="bottts"
                          hash={acc.publicKeyHash}
                          size={32}
                          className="flex-shrink-0"
                          style={{
                            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.05)"
                          }}
                        />

                        <div className="ml-2 flex flex-col items-start">
                          <div className="flex flex-wrap items-center">
                            <Name className="text-sm font-medium leading-tight">
                              {acc.name}
                            </Name>

                            {acc.type === ThanosAccountType.Imported && (
                              <span
                                className={classNames(
                                  "ml-2",
                                  "rounded-sm",
                                  "border border-black-25",
                                  "px-1 py-px",
                                  "leading-tight",
                                  "text-black-50"
                                )}
                                style={{ fontSize: "0.6rem" }}
                              >
                                Imported
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center">
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

                            <Balance address={acc.publicKeyHash}>
                              {bal => (
                                <div
                                  className={classNames(
                                    "ml-2",
                                    "text-xs leading-none",
                                    "text-gray-600"
                                  )}
                                >
                                  <Money>{bal}</Money>{" "}
                                  <span style={{ fontSize: "0.75em" }}>
                                    {assetSymbol}
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
    </>
  );
};

export default SendForm;

type OperationStatusProps = {
  operation: any;
};

const OperationStatus: React.FC<OperationStatusProps> = ({ operation }) => {
  const descFooter = React.useMemo(
    () => (
      <div className="mt-2 text-xs">
        Operation Hash:{" "}
        <HashChip
          hash={operation.hash}
          firstCharsCount={10}
          lastCharsCount={7}
          small
        />
      </div>
    ),
    [operation.hash]
  );

  const [alert, setAlert] = useSafeState<{
    type: "success" | "error";
    title: string;
    description: React.ReactNode;
  }>(() => ({
    type: "success",
    title: "Success",
    description: (
      <>
        🛫 Transaction request sent! Confirming...
        {descFooter}
      </>
    )
  }));

  React.useEffect(() => {
    operation
      .confirmation()
      .then(() => {
        setAlert(a => ({
          ...a,
          description: (
            <>
              ✅ Transaction successfully processed and confirmed!
              {descFooter}
            </>
          )
        }));
      })
      .catch(() => {
        setAlert({
          type: "error",
          title: "Error",
          description: "Failed. Something went wrong ;("
        });
      });
  }, [operation, setAlert, descFooter]);

  return (
    <Alert
      type={alert.type}
      title={alert.title}
      description={alert.description}
      className="mb-8"
    />
  );
};

type TransferErrorCaptionProps = {
  type: "transfer" | "estimate";
  zeroBalance?: boolean;
};

const TransferErrorCaption: React.FC<TransferErrorCaptionProps> = ({
  type,
  zeroBalance
}) => (
  <Alert
    type={type === "transfer" ? "error" : "warn"}
    title={type === "transfer" ? "Failed" : "No funds to send 😶"}
    description={
      zeroBalance ? (
        <>Your Balance is equals to Zero.</>
      ) : (
        <>
          Unable to {type} transaction to provided Recipient.
          <br />
          This may happen because:
          <ul className="mt-1 ml-2 list-disc list-inside text-xs">
            <li>
              Minimal fee for transaction is greater than your balance. A large
              fee may be due because you sending funds to an empty account. That
              requires a one-time 0.257 XTZ burn fee;
            </li>
            <li>Network or other tech issue.</li>
          </ul>
        </>
      )
    }
    className={classNames("mt-6 mb-4")}
  />
);

function hasManager(manager: any) {
  return manager && typeof manager === "object" ? !!manager.key : !!manager;
}

function tzToMutez(tz: any) {
  return Tezos.format("tz", "mutez", tz) as BigNumber;
}

function mutezToTz(mutez: any) {
  return Tezos.format("mutez", "tz", mutez) as BigNumber;
}

function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

// function formatEstimate(estimate: any) {
//   return {
//     storageLimit: estimate.storageLimit,
//     burnFeeMutez: estimate.burnFeeMutez,
//     gasLimit: estimate.gasLimit,
//     minimalFeeMutez: estimate.minimalFeeMutez,
//     suggestedFeeMutez: estimate.suggestedFeeMutez,
//     usingBaseFeeMutez: estimate.usingBaseFeeMutez,
//     totalCost: estimate.totalCost
//   };
// }
