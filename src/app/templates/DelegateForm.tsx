import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR, { mutate } from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE, Tezos } from "@taquito/taquito";
import { ValidationResult, validateAddress } from "@taquito/utils";
import {
  useReadyThanos,
  useBalance,
  fetchBalance,
  getBalanceSWRKey,
  useKnownBakers,
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
  fee: number;
}

const MIN_AMOUNT = 0.000001;
const RECOMMENDED_ADD_FEE = 100;
const NOT_ENOUGH_FUNDS = Symbol("NOT_ENOUGH_FUNDS");

const DelegateForm: React.FC = () => {
  const { accountPkh, allAccounts, tezos, tezosKey } = useReadyThanos();

  const assetSymbol = "XTZ";

  const balSWR = useBalance(accountPkh, true);
  const balance = balSWR.data!;
  const revalidateBalance = balSWR.revalidate;
  const balanceNum = balance.toNumber();

  const knownBakers = useKnownBakers();
  const sortedKnownBakers = React.useMemo(
    () =>
      knownBakers &&
      knownBakers.sort((a, b) => b.total_points - a.total_points),
    [knownBakers]
  );

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
    reset,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      fee: recommendedAddFeeTz,
    },
  });

  const toValue = watch("to");

  const toFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const feeFieldRef = React.useRef<HTMLInputElement>(null);

  const toFilled = React.useMemo(
    () => Boolean(toValue && isAddressValid(toValue)),
    [toValue]
  );

  const filledAccount = React.useMemo(
    () =>
      (toFilled && allAccounts.find((a) => a.publicKeyHash === toValue)) ||
      null,
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
        await new Promise((r) => setTimeout(r, 300));
        return NOT_ENOUGH_FUNDS;
      }

      const to = toValue;
      const estmtn = await tezos.estimate.setDelegate({
        source: accountPkh,
        delegate: to,
      });
      const manager = await tezos.rpc.getManagerKey(accountPkh);
      let baseFee = mutezToTz(estmtn.totalCost);
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
    () =>
      toFilled ? ["delegate-base-fee", toValue, tezosKey, accountPkh] : null,
    estimateBaseFee,
    {
      dedupingInterval: 30_000,
    }
  );

  const maxAddFee = React.useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(balanceNum)
        .minus(baseFee)
        .minus(MIN_AMOUNT)
        .toNumber();
    }
  }, [balanceNum, baseFee]);

  const handleFeeFieldChange = React.useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  const handleSetRecommendedFee = React.useCallback(() => {
    setValue("fee", recommendedAddFeeTz);
  }, [setValue, recommendedAddFeeTz]);

  const [submitError, setSubmitError] = useSafeState<React.ReactNode>(null);
  const [operation, setOperation] = useSafeState<any>(null);

  const onSubmit = React.useCallback(
    async ({ to, fee: feeVal }: FormData) => {
      if (formState.isSubmitting) return;
      setSubmitError(null);
      setOperation(null);

      try {
        const estmtn = await tezos.estimate.setDelegate({
          source: accountPkh,
          delegate: to,
        });
        const addFee = tzToMutez(feeVal ?? 0);
        const fee = addFee.plus(estmtn.usingBaseFeeMutez).toNumber();
        const op = await tezos.contract.setDelegate({
          source: accountPkh,
          delegate: to,
          fee,
        });
        setOperation(op);
        reset({ to: "", fee: recommendedAddFeeTz });
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
      formState.isSubmitting,
      tezos,
      accountPkh,
      setSubmitError,
      setOperation,
      reset,
      recommendedAddFeeTz,
    ]
  );

  const restFormDisplayed = Boolean(toFilled && baseFee);
  const estimateFallbackDisplayed =
    toFilled && (!baseFee || baseFee === NOT_ENOUGH_FUNDS) && estimating;

  return (
    <>
      {operation && (
        <OperationStatus
          operation={operation}
          revalidateBalance={revalidateBalance}
        />
      )}

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
                      {(usdBalance) => (
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
            validate: validateAddress,
          }}
          onChange={([v]) => v}
          onFocus={() => toFieldRef.current?.focus()}
          textarea
          rows={2}
          id="delegate-to"
          label="Baker"
          labelDescription={
            filledAccount ? (
              <div className="flex flex-wrap items-center">
                <Identicon
                  type="bottts"
                  hash={filledAccount.publicKeyHash}
                  size={14}
                  className="flex-shrink-0 opacity-75 shadow-xs"
                />
                <div className="ml-1 mr-px font-normal">
                  {filledAccount.name}
                </div>{" "}
                (
                <Balance address={filledAccount.publicKeyHash}>
                  {(bal) => (
                    <span className={classNames("text-xs leading-none")}>
                      <Money>{bal}</Money>{" "}
                      <span style={{ fontSize: "0.75em" }}>{assetSymbol}</span>
                    </span>
                  )}
                </Balance>
                )
              </div>
            ) : (
              `Address of already registered baker to delegate funds to.`
            )
          }
          placeholder="tz1a9w1S7hN5s..."
          errorCaption={errors.to?.message}
          style={{
            resize: "none",
          }}
          containerClassName="mb-4"
        />

        {estimateFallbackDisplayed ? (
          <div className="my-8 flex justify-center">
            <Spinner className="w-20" />
          </div>
        ) : restFormDisplayed ? (
          <>
            {(baseFee === NOT_ENOUGH_FUNDS || submitError) && (
              <TransferErrorCaption
                type={submitError ? "transfer" : "estimate"}
                zeroBalance={balance.isZero()}
              />
            )}

            <Controller
              name="fee"
              as={<AssetField ref={feeFieldRef} />}
              control={control}
              onChange={handleFeeFieldChange}
              onFocus={() => feeFieldRef.current?.focus()}
              id="delegate-fee"
              assetSymbol={assetSymbol}
              label="Additional Fee"
              labelDescription={
                baseFee instanceof BigNumber && (
                  <>
                    Base Fee for this operation is:{" "}
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
              Delegate
            </FormSubmitButton>
          </>
        ) : (
          sortedKnownBakers && (
            <div className={classNames("my-6", "flex flex-col")}>
              <h2
                className={classNames("mb-4", "leading-tight", "flex flex-col")}
              >
                <span className="text-base font-semibold text-gray-700">
                  Delegate to Recommended Bakers
                </span>

                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  Click on Baker you want to delegate funds to. This list is
                  powered by{" "}
                  <a
                    href="https://www.tezos-nodes.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal underline"
                  >
                    Tezos Nodes
                  </a>
                  .
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
                {sortedKnownBakers.map((baker, i, arr) => {
                  const last = i === arr.length - 1;
                  const handleBakerClick = () => {
                    setValue("to", baker.address);
                    triggerValidation("to");
                  };

                  return (
                    <button
                      key={baker.address}
                      type="button"
                      className={classNames(
                        "block w-full",
                        "overflow-hidden",
                        !last && "border-b border-gray-200",
                        "hover:bg-gray-200 focus:bg-gray-200",
                        "flex items-strech",
                        "text-gray-700",
                        "transition ease-in-out duration-200",
                        "focus:outline-none",
                        "opacity-90 hover:opacity-100"
                      )}
                      style={{
                        padding: "0.65rem 0.5rem 0.65rem 0.5rem",
                      }}
                      onClick={handleBakerClick}
                    >
                      <img
                        src={baker.logo}
                        alt={baker.name}
                        className={classNames(
                          "flex-shrink-0",
                          "w-10 h-auto",
                          "bg-white rounded shadow-xs"
                        )}
                      />

                      <div className="ml-2 flex flex-col items-start">
                        <div
                          className={classNames(
                            "mb-px",
                            "flex flex-wrap items-center",
                            "leading-noneleading-none"
                          )}
                        >
                          <Name className="text-base font-medium pb-1">
                            {baker.name}
                          </Name>

                          <span
                            className={classNames(
                              "ml-2",
                              "text-xs text-black-50 pb-px"
                            )}
                          >
                            {baker.lifetime} cycles
                          </span>
                        </div>

                        <div
                          className={classNames(
                            "mb-1 pl-px",
                            "flex flex-wrap items-center"
                          )}
                        >
                          <div
                            className={classNames(
                              "text-xs font-light leading-none",
                              "text-gray-600"
                            )}
                          >
                            Fee:{" "}
                            <span className="font-normal">
                              {new BigNumber(baker.fee).times(100).toFormat(2)}%
                            </span>
                          </div>
                        </div>

                        <div className="pl-px flex flex-wrap items-center">
                          <div
                            className={classNames(
                              "text-xs font-light leading-none",
                              "text-gray-600"
                            )}
                          >
                            Space:{" "}
                            <span className="font-normal">
                              <Money>{baker.freespace}</Money>
                            </span>{" "}
                            <span style={{ fontSize: "0.75em" }}>
                              {assetSymbol}
                            </span>
                          </div>
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

export default DelegateForm;

type OperationStatusProps = {
  operation: any;
  revalidateBalance?: () => any;
};

const OperationStatus: React.FC<OperationStatusProps> = ({
  operation,
  revalidateBalance,
}) => {
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
    title: "Success 🛫",
    description: (
      <>
        Transaction request sent! Confirming...
        {descFooter}
      </>
    ),
  }));

  React.useEffect(() => {
    operation
      .confirmation()
      .then(() => {
        setAlert((a) => ({
          ...a,
          title: "Success ✅",
          description: (
            <>
              Transaction successfully processed and confirmed!
              {descFooter}
            </>
          ),
        }));

        if (revalidateBalance) {
          revalidateBalance();
        }
      })
      .catch(() => {
        setAlert({
          type: "error",
          title: "Error",
          description: "Failed. Something went wrong ;(",
        });
      });
  }, [operation, setAlert, descFooter, revalidateBalance]);

  return (
    <Alert
      type={alert.type}
      title={alert.title}
      description={alert.description}
      autoFocus
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
  zeroBalance,
}) => (
  <Alert
    type={type === "transfer" ? "error" : "warn"}
    title={zeroBalance ? "Not enough funds 😶" : "Failed"}
    description={
      zeroBalance ? (
        <>Your Balance is zero.</>
      ) : (
        <>
          Unable to {type === "transfer" ? "delegate" : "estimate delegation"}{" "}
          to provided Baker.
          <br />
          This may happen because:
          <ul className="mt-1 ml-2 list-disc list-inside text-xs">
            <li>
              Minimal fee for this transaction is greater than your balance. A
              large fee may be due because you sending funds to an empty Manager
              account. That requires a one-time 0.257 XTZ burn fee;
            </li>
            <li>Network or other tech issue.</li>
          </ul>
        </>
      )
    }
    autoFocus
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
