import classNames from "clsx";
import React from "react";
import { useForm } from "react-hook-form";
import { useAssets } from "lib/temple/front";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import SwapInput from "app/templates/SwapForm/SwapInput";

type SwapFormValues = {
  inputAsset: string;
  inputAssetAmount: number;
};

const SwapForm: React.FC = () => {
  const formContextValues = useForm<SwapFormValues>();
  const { handleSubmit } = formContextValues;
  const { allAssets } = useAssets();
  const disabled = false;

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <SwapInput
        assetInputName="inputAsset"
        amountInputName="inputAssetAmount"
        formContextValues={formContextValues}
        assets={allAssets}
        withPercentageButtons
      />

      <FormSubmitButton
        className={classNames("w-full justify-center border-none")}
        style={{
          padding: "10px 2rem",
          background: disabled ? "#c2c2c2" : "#4299e1",
        }}
      >
        Swap
      </FormSubmitButton>
    </form>
  );
};

export default SwapForm;
