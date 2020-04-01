import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, Tezos } from "@taquito/taquito";
import { ValidationResult, validateAddress } from "@taquito/utils";
import {
  ThanosAccountType,
  useReadyThanos,
  useBalance
} from "lib/thanos/front";
import Balance from "app/templates/Balance";
import Money from "app/atoms/Money";
import AddressField from "app/atoms/AddressField";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
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
    triggerValidation
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: { fee: recommendedAddFeeTz }
  });

  const amountFieldDirty = formState.dirtyFields.has("amount");

  const toValue = watch("to");
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
      const balanceBN = new BigNumber(balanceNum);
      if (balanceBN.isZero()) {
        return NOT_ENOUGH_FUNDS;
      }

      const to = toValue;
      const estmtn = await tezos.estimate.transfer({ to, amount: MIN_AMOUNT });
      let amountMax = balanceBN.minus(mutezToTz(estmtn.burnFeeMutez));
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
  }, [balanceNum, toValue, tezos, accountPkh]);

  const { data: baseFee, isValidating: estimating } = useSWR(
    () =>
      toFilled ? ["base-fee", balanceNum, toValue, tezosKey, accountPkh] : null,
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
      if (v === 0) return "Required";
      if (maxAmount === NOT_ENOUGH_FUNDS)
        return "Not enough funds for this transaction";
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

  const onSubmit = React.useCallback(
    async ({ to, amount, fee: feeVal }: FormData) => {
      try {
        const estmtn = await tezos.estimate.transfer({ to, amount });
        const addFee = tzToMutez(feeVal ?? 0);
        const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
        const op = await tezos.contract.transfer({ to, amount, fee });
        console.info(op);
        await op.confirmation();
        alert("DONE");
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        alert(err.message);
      }
    },
    [tezos]
  );

  const restFormDisplayed = Boolean(toFilled && baseFee);
  const estimateFallbackDisplayed =
    toFilled && (!baseFee || baseFee === NOT_ENOUGH_FUNDS) && estimating;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {React.useMemo(
        () => (
          <div className="flex items-center mb-4 border p-2 rounded-md">
            <img
              src={xtzImgUrl}
              alt={assetSymbol}
              className="h-12 w-auto mr-2"
            />

            <div className="font-light leading-none">
              <div className="text-xl font-normal text-gray-800 mb-1">
                {assetSymbol}
              </div>

              <div className="text-base text-gray-600">
                Balance:{" "}
                <span className="text-gray-600 text-lg">
                  <Money>{balance}</Money>
                </span>
              </div>
            </div>
          </div>
        ),
        [assetSymbol, balance]
      )}

      <Controller
        name="to"
        as={<AddressField ref={toFieldRef} />}
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
              <div className="ml-1 mr-px font-normal">{filledAccount.name}</div>{" "}
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
        placeholder="tz1a9w1S7h..."
        errorCaption={errors.to?.message}
        style={{
          resize: "none"
        }}
        containerClassName="mb-4"
      />

      {estimateFallbackDisplayed ? (
        <div className="my-4 text-center text-sm font-lighter text-gray-700">
          Estimating...
        </div>
      ) : restFormDisplayed ? (
        <>
          <Controller
            name="amount"
            as={<AssetField ref={amountFieldRef} />}
            control={control}
            rules={{
              required: "Required",
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

          <FormSubmitButton loading={formState.isSubmitting}>
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
  );
};

export default SendForm;

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
