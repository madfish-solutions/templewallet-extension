import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, Tezos } from "@taquito/taquito";
import { ValidationResult, validateAddress } from "@taquito/utils";
import {
  ThanosAccountType,
  useReadyThanos,
  useBalance
} from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import Balance from "app/templates/Balance";
import Money from "app/atoms/Money";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import xtzImgUrl from "app/misc/xtz.png";
import { ReactComponent as SendIcon } from "app/icons/send.svg";

const Send: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <SendIcon className="mr-1 h-4 w-auto stroke-current" /> Send
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <Form />
      </div>
    </div>
  </PageLayout>
);

export default Send;

interface FormData {
  to: string;
  amount: string;
  fee: string;
}

const RECOMMENDED_ADD_FEE = 100;
const NOT_ENOUGH_FUNDS = Symbol("NOT_ENOUGH_FUNDS");

const Form: React.FC = () => {
  const { accountPkh, allAccounts, tezos, tezosKey } = useReadyThanos();

  const assetSymbol = "XTZ";

  const balSWR = useBalance(accountPkh, true);
  const balance = balSWR.data!;
  const balanceNum = balance.toNumber();

  const validateAddress = React.useCallback((v: any) => {
    switch (false) {
      case isAddressValid(v):
        return "Invalid address";

      // case v !== accountPkh:
      //   return "This is your address. It cannot be used";

      default:
        return true;
    }
  }, []);

  const recommendedAddFeeTz = React.useMemo(
    () => mutezToTz(RECOMMENDED_ADD_FEE).toString(),
    []
  );

  const {
    watch,
    register,
    handleSubmit,
    errors,
    formState,
    setValue,
    triggerValidation
  } = useForm<FormData>({
    mode: "onBlur",
    defaultValues: { fee: recommendedAddFeeTz }
  });
  const vls = watch();
  const feeValue = watch("fee", recommendedAddFeeTz);

  const toFilled = React.useMemo(
    () => Boolean(vls.to && isAddressValid(vls.to)),
    [vls.to]
  );

  const filledAccount = React.useMemo(
    () =>
      (toFilled && allAccounts.find(a => a.publicKeyHash === vls.to)) || null,
    [toFilled, allAccounts, vls.to]
  );

  const estimateBaseFee = React.useCallback(async () => {
    try {
      const balanceBN = new BigNumber(balanceNum);
      if (balanceBN.isZero()) {
        return NOT_ENOUGH_FUNDS;
      }

      const to = vls.to;
      const estmtn = await tezos.estimate.transfer({ to, amount: 0.000001 });
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
  }, [balanceNum, vls.to, tezos, accountPkh]);

  const { data: baseFee, isValidating: estimating } = useSWR(
    () =>
      toFilled ? ["base-fee", balanceNum, vls.to, tezosKey, accountPkh] : null,
    estimateBaseFee,
    {
      dedupingInterval: 30_000
    }
  );

  const maxAmount = React.useMemo(() => {
    if (!baseFee || baseFee === NOT_ENOUGH_FUNDS) return null;
    const addFee = feeValue ? new BigNumber(feeValue) : 0;
    return balance.minus(baseFee).minus(addFee);
  }, [balance, baseFee, feeValue]);

  const validateAmount = React.useCallback(
    (v: string) => {
      if (baseFee === NOT_ENOUGH_FUNDS)
        return "Not enough funds for this transaction";
      if (!maxAmount) return true;
      const vBN = new BigNumber(v);
      return (
        vBN.isLessThanOrEqualTo(maxAmount) || `Maximal: ${maxAmount.toString()}`
      );
    },
    [maxAmount, baseFee]
  );

  React.useLayoutEffect(() => {
    if (formState.dirtyFields.has("amount")) {
      triggerValidation("amount");
    }
  }, [triggerValidation, formState.dirtyFields, maxAmount, baseFee]);

  const handleSetMaxAmount = React.useCallback(() => {
    if (maxAmount) {
      setValue("amount", maxAmount.toString());
      triggerValidation("amount");
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleSetRecommendedFee = React.useCallback(() => {
    setValue("fee", recommendedAddFeeTz);
  }, [setValue, recommendedAddFeeTz]);

  const onSubmit = React.useCallback(
    async ({ to, amount: amountVal, fee: feeVal }) => {
      try {
        const amount = new BigNumber(amountVal).toNumber();
        const estmtn = await tezos.estimate.transfer({ to, amount });
        const addFee = tzToMutez(feeVal || 0);
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
  const estimateFallbackDisplayed = !baseFee && estimating;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center mb-4 border p-2 rounded-md">
        <img src={xtzImgUrl} alt={assetSymbol} className="h-12 w-auto mr-2" />

        <div className="font-light leading-none">
          <div className="text-xl font-normal text-gray-800 mb-1">
            {assetSymbol}
          </div>

          <div className="text-base text-gray-600">
            Balance: <Money>{balance}</Money> {assetSymbol}
          </div>
        </div>
      </div>

      <FormField
        ref={register({
          required: "Required",
          validate: validateAddress
        })}
        name="to"
        id="send-to"
        label="Recipient address"
        labelDescription={
          filledAccount ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                hash={filledAccount.publicKeyHash}
                size={14}
                className="flex-shrink-0 opacity-75"
                style={{
                  boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.05)"
                }}
              />
              <div className="ml-1 font-normal">{filledAccount.name}</div>(
              <Balance address={filledAccount.publicKeyHash}>
                {bal => (
                  <span className={classNames("text-xs leading-none")}>
                    <Money>{bal}</Money>{" "}
                    <span style={{ fontSize: "0.5rem" }}>XTZ</span>
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
        containerClassName="mb-4"
      />

      {estimateFallbackDisplayed ? (
        <div className="my-4 text-center text-sm font-lighter text-gray-700">
          Estimating...
        </div>
      ) : restFormDisplayed ? (
        <>
          <FormField
            ref={register({
              required: "Required",
              validate: validateAmount
            })}
            name="amount"
            id="send-amount"
            label="Amount"
            labelDescription={
              maxAmount && (
                <>
                  Available to send:{" "}
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
            autoFocus
          />

          <FormField
            ref={register({
              required: "Required"
            })}
            name="fee"
            id="send-fee"
            label="Additional Fee"
            labelDescription={
              baseFee instanceof BigNumber && (
                <>
                  Base Fee for this transaction is:{" "}
                  <span className="font-semibold">
                    {baseFee.toString()} XTZ
                  </span>
                  <br />
                  Additional - for validators, recommended -{" "}
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
        <div className={classNames("my-6", "flex flex-col")}>
          <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
            <span className="text-base font-semibold text-gray-700">
              Send to My Accounts
            </span>

            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
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
            {allAccounts.map((acc, i, arr) => {
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
                    padding: "0.375rem"
                  }}
                  onClick={handleAccountClick}
                >
                  <Identicon
                    hash={acc.publicKeyHash}
                    size={32}
                    className="flex-shrink-0"
                    style={{
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.15)"
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
                            <span style={{ fontSize: "0.5rem" }}>XTZ</span>
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
      )}
    </form>
  );
};

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
