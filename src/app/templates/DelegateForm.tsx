import * as React from "react";
import classNames from "clsx";
import { useForm, Controller } from "react-hook-form";
import useSWR from "swr";
import BigNumber from "bignumber.js";
import { DEFAULT_FEE } from "@taquito/taquito";
import { useLocation, Link } from "lib/woozie";
import {
  useNetwork,
  useAccount,
  useTezos,
  useBalance,
  usePendingOperations,
  useKnownBaker,
  useKnownBakers,
  fetchBalance,
  tzToMutez,
  mutezToTz,
  isAddressValid,
  hasManager,
} from "lib/thanos/front";
import useSafeState from "lib/ui/useSafeState";
import {
  ArtificialError,
  NotEnoughFundsError,
  ZeroBalanceError,
} from "app/defaults";
import { useAppEnv } from "app/env";
import InUSD from "app/templates/InUSD";
import OperationStatus from "app/templates/OperationStatus";
import Spinner from "app/atoms/Spinner";
import Money from "app/atoms/Money";
import NoSpaceField from "app/atoms/NoSpaceField";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import Alert from "app/atoms/Alert";
import BakerBanner from "app/templates/BakerBanner";
import xtzImgUrl from "app/misc/xtz.png";

const PENNY = 0.000001;
const RECOMMENDED_ADD_FEE = 0.0001;
const SORT_BAKERS_BY_KEY = "sort_bakers_by";
const BAKER_SORT_TYPES = [
  {
    key: "rank",
    title: "Rank",
  },
  {
    key: "fee",
    title: "Fee",
  },
  { key: "space", title: "Space" },
];

interface FormData {
  to: string;
  fee: number;
}

const DelegateForm: React.FC = () => {
  const { registerBackHandler } = useAppEnv();

  const net = useNetwork();
  const acc = useAccount();
  const tezos = useTezos();

  const accountPkh = acc.publicKeyHash;
  const assetSymbol = "XTZ";

  const { data: balanceData, mutate: mutateBalance } = useBalance(accountPkh);
  const balance = balanceData!;
  const balanceNum = balance!.toNumber();

  const { addPndOps } = usePendingOperations();
  const knownBakers = useKnownBakers();

  const { search } = useLocation();
  const sortBakersBy = React.useMemo(() => {
    const usp = new URLSearchParams(search);
    const val = usp.get(SORT_BAKERS_BY_KEY);
    return (
      BAKER_SORT_TYPES.find(({ key }) => key === val) ?? BAKER_SORT_TYPES[0]
    );
  }, [search]);

  const sortedKnownBakers = React.useMemo(() => {
    if (!knownBakers) return null;

    const toSort = Array.from(knownBakers);
    switch (sortBakersBy.key) {
      case "fee":
        return toSort.sort((a, b) => a.fee - b.fee);

      case "space":
        return toSort.sort((a, b) => b.freespace - a.freespace);

      case "rank":
      default:
        return toSort.sort((a, b) => {
          if (a.total_points === b.total_points) {
            return a.fee - b.fee;
          }
          return b.total_points - a.total_points;
        });
    }
  }, [knownBakers, sortBakersBy]);

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

  const toFieldRef = React.useRef<HTMLTextAreaElement>(null);
  const feeFieldRef = React.useRef<HTMLInputElement>(null);

  const toFilled = React.useMemo(
    () => Boolean(toValue && isAddressValid(toValue)),
    [toValue]
  );

  const cleanToField = React.useCallback(() => {
    setValue("to", "");
  }, [setValue]);

  React.useLayoutEffect(() => {
    if (toFilled) {
      return registerBackHandler(() => {
        cleanToField();
        window.scrollTo(0, 0);
      });
    }
  }, [toFilled, registerBackHandler, cleanToField]);

  const estimateBaseFee = React.useCallback(async () => {
    try {
      const balanceBN = (await mutateBalance(fetchBalance(accountPkh, tezos)))!;
      if (balanceBN.isZero()) {
        throw new ZeroBalanceError();
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
        case ["delegate.unchanged", "delegate.already_active"].some((t) =>
          err?.id.includes(t)
        ):
          return new UnchangedError(err.message);

        case err?.id.includes("unregistered_delegate"):
          return new UnregisteredDelegateError(err.message);

        default:
          throw err;
      }
    }
  }, [tezos, accountPkh, toValue, mutateBalance]);

  const {
    data: baseFee,
    error: estimateBaseFeeError,
    isValidating: estimating,
  } = useSWR(
    () =>
      toFilled
        ? ["delegate-base-fee", tezos.checksum, accountPkh, toValue]
        : null,
    estimateBaseFee,
    {
      shouldRetryOnError: false,
      focusThrottleInterval: 10_000,
      dedupingInterval: 30_000,
    }
  );
  const estimationError =
    baseFee instanceof Error ? baseFee : estimateBaseFeeError;

  const { data: baker, isValidating: bakerValidating } = useKnownBaker(
    toFilled ? toValue : null,
    false
  );

  const maxAddFee = React.useMemo(() => {
    if (baseFee instanceof BigNumber) {
      return new BigNumber(balanceNum).minus(baseFee).minus(PENNY).toNumber();
    }
  }, [balanceNum, baseFee]);

  const handleFeeFieldChange = React.useCallback(
    ([v]) => (maxAddFee && v > maxAddFee ? maxAddFee : v),
    [maxAddFee]
  );

  const handleSetRecommendedFee = React.useCallback(() => {
    setValue("fee", RECOMMENDED_ADD_FEE);
  }, [setValue]);

  const [submitError, setSubmitError] = useSafeState<React.ReactNode>(
    null,
    `${tezos.checksum}_${toValue}`
  );
  const [operation, setOperation] = useSafeState<any>(null, tezos.checksum);

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

        const { hash, results } = op;
        const pndOps = Array.from(results)
          .reverse()
          .map((o) => ({
            hash,
            kind: o.kind,
            amount:
              (o as any).amount && mutezToTz(+(o as any).amount).toNumber(),
            destination: (o as any).destination,
            addedAt: new Date().toString(),
          }));
        addPndOps(pndOps);

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
      formState.isSubmitting,
      tezos,
      accountPkh,
      setSubmitError,
      setOperation,
      addPndOps,
      reset,
    ]
  );

  const restFormDisplayed = Boolean(toFilled && (baseFee || estimationError));
  const estimateFallbackDisplayed =
    toFilled && !baseFee && (estimating || bakerValidating);
  const tzError = submitError || estimationError;

  return (
    <>
      {operation && (
        <OperationStatus typeTitle="Delegation" operation={operation} />
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
                className="w-auto h-12 mr-3"
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
            validate: validateAddressForm,
          }}
          onChange={([v]) => v}
          onFocus={() => toFieldRef.current?.focus()}
          textarea
          rows={2}
          cleanable={Boolean(toValue)}
          onClean={cleanToField}
          id="delegate-to"
          label="Baker"
          labelDescription="Address of a registered baker"
          placeholder="e.g. tz1a9w1S7hN5s..."
          errorCaption={errors.to?.message}
          style={{
            resize: "none",
          }}
          containerClassName="mb-4"
        />

        {estimateFallbackDisplayed ? (
          <div className="flex justify-center my-8">
            <Spinner className="w-20" />
          </div>
        ) : restFormDisplayed ? (
          <>
            {baker ? (
              <>
                <div
                  className={classNames(
                    "-mt-2 mb-6", // -mt-6
                    "flex flex-col items-center"
                  )}
                >
                  <BakerBanner
                    bakerPkh={baker!.address}
                    // className="border-t-0 rounded-t-none"
                    displayAddress={false}
                  />
                </div>

                {!tzError && baker!.min_delegations_amount > balanceNum && (
                  <Alert
                    type="warn"
                    title="Minimal delegation amount"
                    description={
                      <>
                        Your current balance is less than a minimal delegation
                        amount of this baker. That means while the balance is
                        less than{" "}
                        <span className="font-normal">
                          <Money>{baker!.min_delegations_amount}</Money>{" "}
                          <span style={{ fontSize: "0.75em" }}>
                            {assetSymbol}
                          </span>
                        </span>{" "}
                        - there will be no payouts.
                      </>
                    }
                    className="mb-6"
                  />
                )}
              </>
            ) : !tzError && net.type === "main" ? (
              <Alert
                type="warn"
                title="Unknown baker"
                description="Provided address is not registered as a baker! Only delegate funds to it at your own risk."
                className="mb-6"
              />
            ) : null}

            {tzError && (
              <DelegateErrorAlert
                type={submitError ? "submit" : "estimation"}
                error={tzError}
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
                    Additional - speeds its confirmation up,
                    <br />
                    recommended:{" "}
                    <button
                      type="button"
                      className={classNames("underline")}
                      onClick={handleSetRecommendedFee}
                    >
                      {RECOMMENDED_ADD_FEE}
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
              disabled={formState.isSubmitting || Boolean(estimationError)}
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
                  Click on the Baker you want to delegate funds to. This list is
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

              <div className={classNames("mb-2", "flex items-center")}>
                <span className={classNames("mr-1", "text-xs text-gray-500")}>
                  Sort by
                </span>
                {BAKER_SORT_TYPES.map(({ key, title }, i, arr) => {
                  const first = i === 0;
                  const last = i === arr.length - 1;
                  const selected = sortBakersBy.key === key;

                  return (
                    <Link
                      key={key}
                      to={{
                        pathname: "/delegate",
                        search: `${SORT_BAKERS_BY_KEY}=${key}`,
                      }}
                      replace
                      className={classNames(
                        (() => {
                          switch (true) {
                            case first:
                              return classNames(
                                "rounded rounded-r-none",
                                "border"
                              );

                            case last:
                              return classNames(
                                "rounded rounded-l-none",
                                "border border-l-0"
                              );

                            default:
                              return "border border-l-0";
                          }
                        })(),
                        selected && "bg-gray-100",
                        "px-2 py-px",
                        "text-xs text-gray-600"
                      )}
                    >
                      {title}
                    </Link>
                  );
                })}
              </div>

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
                    window.scrollTo(0, 0);
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
                        style={{
                          minHeight: "2.5rem",
                        }}
                      />

                      <div className="flex flex-col items-start ml-2">
                        <div
                          className={classNames(
                            "mb-px",
                            "flex flex-wrap items-center",
                            "leading-none"
                          )}
                        >
                          <Name className="pb-1 text-base font-medium">
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

                        <div className="flex flex-wrap items-center pl-px">
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

type DelegateErrorAlertProps = {
  type: "submit" | "estimation";
  error: Error;
};

const DelegateErrorAlert: React.FC<DelegateErrorAlertProps> = ({
  type,
  error,
}) => (
  <Alert
    type={type === "submit" ? "error" : "warn"}
    title={(() => {
      switch (true) {
        case error instanceof NotEnoughFundsError:
          return "Not enough funds 😶";

        case [UnchangedError, UnregisteredDelegateError].some(
          (Err) => error instanceof Err
        ):
          return "Not allowed";

        default:
          return "Failed";
      }
    })()}
    description={(() => {
      switch (true) {
        case error instanceof ZeroBalanceError:
          return <>Your Balance is zero.</>;

        case error instanceof NotEnoughFundsError:
          return (
            <>Minimal fee for this transaction is greater than your balance.</>
          );

        case error instanceof UnchangedError:
          return (
            <>
              Already delegated funds to this baker. Re-delegation is not
              possible.
            </>
          );

        case error instanceof UnregisteredDelegateError:
          return <>Specified baker is not registered.</>;

        default:
          return (
            <>
              Unable to {type === "submit" ? "delegate" : "estimate delegation"}{" "}
              to the provided Baker.
              <br />
              This may happen because:
              <ul className="mt-1 ml-2 text-xs list-disc list-inside">
                <li>
                  Minimal fee for this transaction is greater than your balance.
                  A large fee may be due because you sending funds to an empty
                  Manager account. That requires a one-time 0.257 XTZ burn fee;
                </li>
                <li>Network or other technical issue.</li>
              </ul>
            </>
          );
      }
    })()}
    autoFocus
    className={classNames("mt-6 mb-4")}
  />
);

class UnchangedError extends Error {}
class UnregisteredDelegateError extends Error {}

function validateAddressForm(value: any) {
  return isAddressValid(value) || "Invalid address";
}
