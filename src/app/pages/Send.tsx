import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, Tezos } from "@taquito/taquito";
import { ValidationResult, validateAddress } from "@taquito/utils";
import { useReadyThanos, useBalance } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import Money from "app/atoms/Money";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import xtzImgUrl from "app/misc/xtz.png";
import { ReactComponent as SendIcon } from "app/icons/send.svg";

interface FormData {
  to: string;
  amount: string;
  fee: string;
}

// https://tezos.stackexchange.com/questions/2164/storage-fee-baker-fee-and-allocation-fee
// Multi step: address => base fee => amount, fee
// One estimated base fee for max value, estimated with max balance
// One estimated fee for

// For estimation.
const FAKE_ADDRESS = "tz1X7QPUFXiLXhddwzf62LJTtBXWEeWNrDNh";

const Send: React.FC = () => {
  const { accountPkh, tezos, tezosKey } = useReadyThanos();

  const assetSymbol = "XTZ";

  const balRes = useBalance(accountPkh, true);
  const balance = balRes.data!;
  const balanceNum = balance.toNumber();

  const {
    watch,
    register,
    handleSubmit,
    errors,
    formState,
    setValue,
    getValues,
    triggerValidation
  } = useForm<FormData>({ defaultValues: { fee: "0.0001" } });
  const vls = watch();

  const estimateBaseFee = React.useCallback(async () => {
    const balanceBN = new BigNumber(balanceNum);
    let optimisticFeeTz = mutezToTz(DEFAULT_FEE.TRANSFER);
    const manager = await tezos.rpc.getManagerKey(accountPkh);
    if (!hasManager(manager)) {
      optimisticFeeTz = optimisticFeeTz.plus(mutezToTz(DEFAULT_FEE.REVEAL));
    }

    if (optimisticFeeTz.isGreaterThan(balanceBN)) {
      return tzToMutez(optimisticFeeTz);
    }

    const to = FAKE_ADDRESS;
    const amount = 313.187549 - 0.257; // balanceBN.minus(optimisticFeeTz).toNumber();
    console.info(balanceNum);
    const estimate = await tezos.estimate.transfer({ to, amount });
    console.info({
      storageLimit: estimate.storageLimit,
      burnFeeMutez: estimate.burnFeeMutez,
      gasLimit: estimate.gasLimit,
      minimalFeeMutez: estimate.minimalFeeMutez,
      suggestedFeeMutez: estimate.suggestedFeeMutez,
      usingBaseFeeMutez: estimate.usingBaseFeeMutez,
      totalCost: estimate.totalCost
    });

    let total = new BigNumber(estimate.totalCost);
    if (!hasManager(manager)) {
      total = total.plus(DEFAULT_FEE.REVEAL);
    }
    return total;
  }, [tezos, accountPkh, balanceNum]);
  // "312930553"
  // 312930553
  // storageLimit: 257
  // burnFeeMutez: 257000
  // gasLimit: 10307
  // minimalFeeMutez: 1219
  // suggestedFeeMutez: 1319
  // usingBaseFeeMutez: 1219
  // totalCost: 258219
  const baseFeeRes = useSWR(
    ["base-fee", tezosKey, accountPkh, balanceNum],
    estimateBaseFee,
    { suspense: true }
  );

  const baseFee = baseFeeRes.data!;

  const getTotalFee = React.useCallback(
    (feeVal: string) => baseFee.plus(tzToMutez(feeVal || 0)),
    [baseFee]
  );

  const getAvailableAmount = React.useCallback(
    (totalFee: BigNumber) => {
      const feeTz = mutezToTz(totalFee);
      return balance.isGreaterThan(feeTz)
        ? balance.minus(feeTz)
        : new BigNumber(0);
    },
    [balance]
  );

  const totalFee = React.useMemo(() => getTotalFee(vls.fee), [
    getTotalFee,
    vls.fee
  ]);

  const avaiableAmount = React.useMemo(
    () => totalFee && getAvailableAmount(totalFee),
    [totalFee, getAvailableAmount]
  );
  // 2012.004686
  // 2011.510086
  // 0.234794
  // 257000 ? = 0.257 XTZ - revelation fixed cost
  React.useEffect(() => {
    if (vls.amount && avaiableAmount) {
      triggerValidation("amount");
    }
  }, [triggerValidation, avaiableAmount, vls.amount]);

  const onSubmit = React.useCallback(
    async ({ to, amount: amountVal, fee: feeVal }: FormData) => {
      try {
        const amountBN = new BigNumber(amountVal);
        const amount = amountBN.toNumber();
        const estimate = await tezos.estimate.transfer({ to, amount });
        const addFeeMutez = tzToMutez(feeVal);
        const fee = addFeeMutez.plus(estimate.usingBaseFeeMutez).toNumber();
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
    [tezos, baseFee, accountPkh]
  );

  const handleSetMaxAmount = React.useCallback(() => {
    if (avaiableAmount) {
      setValue("amount", avaiableAmount.toString());
    }
  }, [setValue, avaiableAmount]);

  return (
    <PageLayout
      pageTitle={
        <>
          <SendIcon
            className={classNames("mr-1 h-4 w-auto", "stroke-current")}
          />{" "}
          Send
        </>
      }
    >
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          <form onSubmit={handleSubmit(onSubmit)}>
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
                  Balance: <Money>{balance}</Money> {assetSymbol}
                </div>
              </div>
            </div>

            <FormField
              ref={register({
                required: "Required",
                validate: v => isAddressValid(v) || "Invalid address"
              })}
              name="to"
              id="send-to"
              label="Recipient address"
              labelDescription={`Address to send ${assetSymbol} funds to`}
              placeholder="tz1a9w1S7h..."
              errorCaption={errors.to?.message}
              containerClassName="mb-4"
            />

            <FormField
              ref={register({
                required: "Required",
                validate: v => {
                  const vls = getValues();
                  const total = getTotalFee(vls.fee);
                  const avaiableAmount = getAvailableAmount(total);
                  const vBN = new BigNumber(v);
                  return (
                    vBN.isLessThanOrEqualTo(avaiableAmount) ||
                    `Maximal: ${avaiableAmount.toString()}`
                  );
                }
              })}
              name="amount"
              id="send-amount"
              label="Amount"
              labelDescription={
                <>
                  Available to send:{" "}
                  {avaiableAmount && (
                    <button
                      type="button"
                      className={classNames("underline")}
                      onClick={handleSetMaxAmount}
                    >
                      {avaiableAmount.toString()}
                    </button>
                  )}
                </>
              }
              placeholder="e.g. 123.45"
              errorCaption={errors.amount?.message}
              containerClassName="mb-4"
            />

            <FormField
              ref={register({
                required: "Required"
              })}
              name="fee"
              id="send-fee"
              label="Additional Fee"
              labelDescription={
                <>
                  Base Fee of this transaction is:{" "}
                  <span className="font-semibold">
                    {mutezToTz(baseFee).toString()} XTZ
                  </span>
                  <br />
                  Total Fee:{" "}
                  <span className="font-semibold">
                    {mutezToTz(totalFee).toString()} XTZ
                  </span>
                </>
              }
              placeholder="0"
              errorCaption={errors.fee?.message}
              containerClassName="mb-4"
            />

            <FormSubmitButton loading={formState.isSubmitting}>
              Send
            </FormSubmitButton>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default () => (
  <React.Suspense fallback={null}>
    <Send />
  </React.Suspense>
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
