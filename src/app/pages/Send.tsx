import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";

import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

import { ACCOUNT_ADDRESS_PATTERN } from "app/defaults";

import xtzImgUrl from "app/misc/xtz.png";

import { ReactComponent as SendIcon } from "app/icons/send.svg";
import { isNumber } from "util";

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
  if (val === "") return "";
  if (!isNaN(numVal) && numVal >= 0 && numVal < Number.MAX_SAFE_INTEGER) {
    return val;
  }
}

const Send: React.FC = () => {
  const primaryRate = 3.19; // XTZ_USDT
  const [balance] = React.useState(342.2324);
  const [isPrimaryExchange, setIsPrimaryExchange] = React.useState(true);

  const TRX_FEE: { [key: string]: number } = {
    small: 0.001,
    medium: 0.002,
    large: 0.004
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

  const [primaryAmount, setPrimaryAmount] = React.useState("");
  const [trxFee, setTrxFee] = React.useState(String(TRX_FEE.small));

  const toggleExchange = (e: any) => {
    e.preventDefault();
    setPrimaryAmount(String(secondaryAmount));
    return setIsPrimaryExchange(!isPrimaryExchange);
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
      if (typeof validNumber === "string") setMethod(validNumber);
      else evt.preventDefault();
    },
    []
  );

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange(e, setPrimaryAmount);

  const handleChangeTrxFee = (e: React.ChangeEvent<HTMLInputElement>): void =>
    handleChange(e, setTrxFee);

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
                required: true,
                pattern: ACCOUNT_ADDRESS_PATTERN
              })}
              name="recipientAddress"
              id="send-recipient-address"
              label="Recipient address"
              labelDescription="Lorem ipsum sit amet."
              placeholder="tz1a9w1S..."
              errorCaption={errors.recipientAddress ? "Invalid address" : null}
              {...fieldParams}
            />
            <FormField
              ref={register({
                required: true,
                min: 0.1,
                max: balance,
                validate: isNumber
              })}
              // name="amount"
              id="send-amount"
              label="Amount"
              value={primaryAmount}
              onInput={(e: any) => handleChangeAmount(e)}
              labelDescription={`${secondaryAmount} ${
                isPrimaryExchange ? "USD" : "XTZ"
              }`}
              placeholder="15.00 XTZ"
              errorCaption={errors.amount ? "Invalid amount" : null}
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
              ref={register({ required: true })}
              value={trxFee}
              onInput={(e: any) => handleChangeTrxFee(e)}
              id="send-transaction-fee"
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
