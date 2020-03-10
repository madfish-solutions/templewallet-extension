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
  amount: number;
  transactionFee: number;
}

function getValidNumber(n: string): string | void {
  let val = n;
  let numVal = +val;
  const indexOfDot = val.indexOf(".");
  if (indexOfDot !== -1 && val.length - indexOfDot > 9) {
    val = val.substring(0, indexOfDot + 9);
    numVal = +val;
  }
  if (val === "" || val === "0") return val;
  if (!isNaN(numVal) && numVal >= 0 && numVal < Number.MAX_SAFE_INTEGER) {
    return val;
  }
}

const Send: React.FC = () => {
  const primaryRate = 3.19; // XTZ_USDT
  const [balance] = React.useState(342.2324);
  const [isPrimaryExchange, setPrimaryExchange] = React.useState(true);

  const TRX_FEE: { [key: string]: number } = {
    small: 0.01,
    medium: 0.02,
    large: 0.04
  };

  type TRX_FEE_KEYS = "small" | "medium" | "large";

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
    { name: "amount", type: "custom" },
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

  const primaryAmount = watch("amount");
  const setPrimaryAmount = (val: any) => setValue("amount", val);

  const trxFee = watch("transactionFee");
  const setTrxFee = (val: any) => setValue("transactionFee", val);

  const toggleExchange = (e: any) => {
    e.preventDefault();
    setPrimaryAmount(String(secondaryAmount));
    return setPrimaryExchange(!isPrimaryExchange);
  };

  const secondaryAmount = React.useMemo(() => {
    if (isPrimaryExchange) return +primaryAmount / primaryRate || 0;
    else return +primaryAmount * primaryRate || 0;
  }, [isPrimaryExchange, primaryAmount]);

  const isActiveTrxFeeBtn = React.useCallback(
    (btnName: TRX_FEE_KEYS): boolean => {
      return +trxFee === TRX_FEE[btnName];
    },
    [TRX_FEE, trxFee]
  );

  const handleChange = React.useCallback(
    (
      evt: React.ChangeEvent<HTMLInputElement>,
      setMethod: (val: React.SetStateAction<string>) => string | void
    ) => {
      let val = evt.target.value.replace(/ /g, "").replace(/,/g, ".");

      const validNumber = getValidNumber(val);
      if (typeof validNumber === "string") {
        setMethod(validNumber);
      }
    },
    []
  );

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange(e, setPrimaryAmount);

  const handleChangeTrxFee = (e: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange(e, setTrxFee);

  React.useEffect(() => {
    if (formState.isSubmitted) triggerValidation("amount");
  }, [errors, formState, primaryAmount, triggerValidation]);

  const onSubmit = React.useCallback(async (data: FormData) => {
    const fetchData = () => new Promise(res => setTimeout(res, 800));

    try {
      await fetchData();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      alert(err.message);
    }
  }, []);

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
              name="amount"
              id="send-amount"
              label="Amount"
              value={primaryAmount ? String(primaryAmount) : ""}
              onInput={(e: any) => handleChangeAmount(e)}
              labelDescription={`${secondaryAmount} ${
                isPrimaryExchange ? "USD" : "XTZ"
              }`}
              placeholder="15.00 XTZ"
              errorCaption={errors.amount?.message}
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
                    Small <br /> ({TRX_FEE.small} XTZ)
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
                    Medium <br /> ({TRX_FEE.medium} XTZ)
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
                    Large <br /> ({TRX_FEE.large} XTZ)
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
