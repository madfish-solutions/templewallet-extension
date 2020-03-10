import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";

import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

import { ACCOUNT_ADDRESS_PATTERN } from "app/defaults";

import xtzImgUrl from "app/misc/xtz.png";

import { ReactComponent as SendIcon } from "app/icons/send.svg";

const fieldParams = {
  containerClassName: "mb-4"
};

interface FormData {
  recipientAddress: string;
  primaryAmount: number;
  transactionFee: number;
}

function getValidNumber(n: string, decimals = 8): string | void {
  let val = n;
  let numVal = +val;
  const indexOfDot = val.indexOf(".");
  if (indexOfDot !== -1 && val.length - indexOfDot > decimals + 1) {
    val = val.substring(0, indexOfDot + decimals + 1);
    numVal = +val;
  }
  if (val === "" || val === "0") return val;
  if (!isNaN(numVal) && numVal >= 0 && numVal < Number.MAX_SAFE_INTEGER) {
    return val;
  }
}

type TRX_FEE_KEYS = "small" | "medium" | "large";

const TRX_FEE: { [key: string]: number } = {
  small: 0.01,
  medium: 0.02,
  large: 0.04
};

const Send: React.FC = () => {
  const primaryRate = 3.19; // XTZ_USDT
  const [balance] = React.useState(342.2324);
  const [isPrimaryExchange, setPrimaryExchange] = React.useState(true);

  const {
    watch,
    register,
    handleSubmit,
    errors,
    triggerValidation,
    formState,
    setValue
  } = useForm<FormData>();

  register(
    { name: "primaryAmount", type: "custom" },
    {
      required: "Required field",
      validate: {
        min: v => {
          const primaryValue = 0.1 + +trxFee;
          const minValue = isPrimaryExchange
            ? primaryValue
            : primaryValue / primaryRate;
          const message = `Minimal value: ${minValue}`;
          return +v >= minValue || message;
        },
        max: v => {
          const primaryValue = balance - +trxFee;
          const maxValue = isPrimaryExchange
            ? primaryValue
            : primaryValue / primaryRate;
          const message = `Maximal value: ${maxValue}`;
          return +v <= maxValue || message;
        }
      }
    }
  );
  register(
    { name: "transactionFee", type: "custom" },
    { required: "Required field" }
  );

  const primaryAmount = watch("primaryAmount");
  const setPrimaryAmount = React.useCallback(
    (val: any) => setValue("primaryAmount", val),
    [setValue]
  );

  const trxFee = watch("transactionFee", String(TRX_FEE.small));
  const setTrxFee = React.useCallback(
    (val: any) => setValue("transactionFee", val),
    [setValue]
  );

  const secondaryAmount = React.useMemo(() => {
    if (isPrimaryExchange) {
      return getValidNumber(String(+primaryAmount / primaryRate), 2) || 0;
    } else {
      return getValidNumber(String(+primaryAmount * primaryRate)) || 0;
    }
  }, [isPrimaryExchange, primaryAmount]);

  const toggleExchange = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setPrimaryAmount(String(secondaryAmount));
      return setPrimaryExchange(!isPrimaryExchange);
    },
    [isPrimaryExchange, secondaryAmount, setPrimaryAmount]
  );

  const isActiveTrxFeeBtn = React.useCallback(
    (btnName: TRX_FEE_KEYS): boolean => {
      return +trxFee === TRX_FEE[btnName];
    },
    [trxFee]
  );

  const handleChange = React.useCallback(
    (
      evt: React.ChangeEvent<HTMLInputElement>,
      setMethod: (val: React.SetStateAction<string>) => string | void,
      decimals?: number
    ) => {
      let val = evt.target.value.replace(/ /g, "").replace(/,/g, ".");

      const validNumber = getValidNumber(val, decimals);
      if (typeof validNumber === "string") {
        setMethod(validNumber);
      }
    },
    []
  );

  const handleChangeAmount = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      handleChange(e, setPrimaryAmount, !isPrimaryExchange ? 2 : undefined),
    [handleChange, isPrimaryExchange, setPrimaryAmount]
  );

  const handleChangeTrxFee = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void =>
      handleChange(e, setTrxFee),
    [handleChange, setTrxFee]
  );

  React.useEffect(() => {
    if (formState.isSubmitted) triggerValidation("primaryAmount");
  }, [errors, formState, primaryAmount, triggerValidation]);

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      const fetchData = () => new Promise(res => setTimeout(res, 800));

      try {
        const amountXTZ = isPrimaryExchange ? primaryAmount : secondaryAmount;

        await fetchData();
        console.log({ ...data, amountXTZ });
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        alert(err.message);
      }
    },
    [isPrimaryExchange, primaryAmount, secondaryAmount]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <SendIcon className="mr-1 h-4 w-auto stroke-current" /> Send
        </>
      }
    >
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center mb-4 border p-2 rounded-md">
              <img src={xtzImgUrl} alt="xtz" className="h-12 w-auto mr-2" />
              <div className="font-light leading-none">
                <div className="text-xl font-normal text-gray-800 mb-1">
                  XTZ
                </div>
                <div className="text-base text-gray-600">
                  Balance: {balance} XTZ
                </div>
              </div>
            </div>
            <FormField
              ref={register({
                required: "Required field",
                pattern: {
                  value: ACCOUNT_ADDRESS_PATTERN,
                  message: "Invalid address"
                }
              })}
              name="recipientAddress"
              id="send-recipient-address"
              label="Recipient address"
              labelDescription="Lorem ipsum sit amet."
              placeholder="tz1a9w1S..."
              errorCaption={
                (errors.recipientAddress && errors.recipientAddress.message) ||
                null
              }
              {...fieldParams}
            />
            <FormField
              name="primaryAmount"
              id="send-amount"
              label="Amount"
              value={primaryAmount ? String(primaryAmount) : ""}
              onInput={(e: any) => handleChangeAmount(e)}
              labelDescription={`${secondaryAmount} ${
                isPrimaryExchange ? "USD" : "XTZ"
              }`}
              placeholder="15.00 XTZ"
              errorCaption={errors.primaryAmount?.message}
              extraButton={
                <FormSubmitButton
                  onClick={toggleExchange}
                  className="ml-3 px-4"
                >
                  {isPrimaryExchange ? "XTZ" : "USD"}
                </FormSubmitButton>
              }
              {...fieldParams}
            />
            <FormField
              value={trxFee}
              onInput={(e: any) => handleChangeTrxFee(e)}
              id="send-transaction-fee"
              name="transactionFee"
              label="Transaction fee"
              placeholder="(auto)"
              labelDescription={
                <div className="mt-1">
                  <button
                    className={classNames(
                      "mr-2 border rounded-md p-2",
                      isActiveTrxFeeBtn("small") &&
                        "text-primary-orange hover:text-primary-orange border-primary-orange",
                      "cursor-pointer hover:text-gray-800"
                    )}
                    onClick={(e: any) => {
                      e.preventDefault();
                      setTrxFee(String(TRX_FEE.small));
                    }}
                  >
                    Slow <br /> ({TRX_FEE.small} XTZ)
                  </button>
                  <button
                    className={classNames(
                      "mr-2 border rounded-md p-2",
                      "cursor-pointer hover:text-gray-800",
                      isActiveTrxFeeBtn("medium") &&
                        "text-primary-orange hover:text-primary-orange border-primary-orange"
                    )}
                    onClick={(e: any) => {
                      e.preventDefault();
                      setTrxFee(String(TRX_FEE.medium));
                    }}
                  >
                    Average <br /> ({TRX_FEE.medium} XTZ)
                  </button>
                  <button
                    className={classNames(
                      "mr-2 border rounded-md p-2",
                      isActiveTrxFeeBtn("large") &&
                        "text-primary-orange hover:text-primary-orange border-primary-orange",
                      "cursor-pointer hover:text-gray-800"
                    )}
                    onClick={(e: any) => {
                      e.preventDefault();
                      setTrxFee(String(TRX_FEE.large));
                    }}
                  >
                    Fast <br /> ({TRX_FEE.large} XTZ)
                  </button>
                </div>
              }
              errorCaption={
                errors.transactionFee ? "Invalid transaction fee" : null
              }
              {...fieldParams}
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

export default Send;
