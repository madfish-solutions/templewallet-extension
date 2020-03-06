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

const Send: React.FC = () => {
  const primaryRate = 3.19; // XTZ_USDT
  const [balance] = React.useState(342.2324);
  const [isPrimaryExchange, setIsPrimaryExchange] = React.useState(true);

  const {
    watch,
    register,
    handleSubmit,
    errors,
    triggerValidation,
    formState,
    setValue
  } = useForm<FormData>();

  const primaryAmount = watch("amount");

  const toggleExchange = (e: any) => {
    e.preventDefault();
    setValue("amount", secondaryAmount);
    return setIsPrimaryExchange(!isPrimaryExchange);
  };

  const secondaryAmount = React.useMemo(() => {
    if (isPrimaryExchange) return primaryAmount / primaryRate;
    else return primaryAmount * primaryRate;
  }, [isPrimaryExchange, primaryAmount]);

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
              name="amount"
              id="send-amount"
              label="Amount"
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
              name="transactionFee"
              id="send-transaction-fee"
              label="Transaction fee"
              placeholder="(auto)"
              labelDescription="Lorem ipsum sit amet."
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
