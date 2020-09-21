import classNames from "clsx";
import React, { useCallback, useState } from "react";
import { Controller, ControllerProps, FieldError } from "react-hook-form";
import BigNumber from "bignumber.js";
import { XTZ_ASSET } from "lib/thanos/front";
import AssetField from "app/atoms/AssetField";
import { ArtificialError } from "app/defaults";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import { ReactComponent as CoffeeIcon } from "app/icons/coffee.svg";
import { ReactComponent as CupIcon } from "app/icons/cup.svg";
import { ReactComponent as RocketIcon } from "app/icons/rocket.svg";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";

export class UnchangedError extends Error {}
export class UnregisteredDelegateError extends Error {}

type AssetFieldProps = typeof AssetField extends React.ForwardRefExoticComponent<
  infer T
>
  ? T
  : never;

export type AdditionalFeeInputProps = Pick<
  ControllerProps<React.ComponentType>,
  "name" | "control" | "onChange"
> & {
  assetSymbol: string;
  baseFee:
    | BigNumber
    | ArtificialError
    | UnchangedError
    | UnregisteredDelegateError
    | undefined;
  error?: FieldError;
  id: string;
};

type FeeOption = {
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  description: string;
  type: "slow" | "fast" | "rocket" | "custom";
  amount?: number;
};

const feeOptions: FeeOption[] = [
  { Icon: CoffeeIcon, description: "Slow", type: "slow", amount: 1e-4 },
  { Icon: CupIcon, description: "Fast", type: "fast", amount: 3e-4 },
  { Icon: RocketIcon, description: "Rocket", type: "rocket", amount: 5e-4 },
  { description: "Custom", type: "custom" },
];

const getFeeOptionId = (option: FeeOption) => option.type;

const AdditionalFeeInput: React.FC<AdditionalFeeInputProps> = (props) => {
  const { assetSymbol, baseFee, control, error, id, name, onChange } = props;

  return (
    <Controller
      name={name}
      as={AdditionalFeeInputContent}
      control={control}
      onChange={onChange}
      id={id}
      assetSymbol={assetSymbol}
      label="Additional Fee"
      labelDescription={
        baseFee instanceof BigNumber && (
          <>
            Base Fee for this operation is:{" "}
            <span className="font-normal">{baseFee.toString()}</span>
            <br />
            Additional - speeds its confirmation up
          </>
        )
      }
      placeholder="0"
      errorCaption={error?.message}
    />
  );
};

export default AdditionalFeeInput;

const AdditionalFeeInputContent: React.FC<AssetFieldProps> = (props) => {
  const {
    className,
    containerClassName,
    onChange,
    assetSymbol,
    id,
    label,
    labelDescription,
    value,
    ...restProps
  } = props;

  const [selectedPreset, setSelectedPreset] = useState<FeeOption["type"]>(
    feeOptions.find(({ amount }) => amount === value)?.type || "custom"
  );
  const handlePresetSelected = useCallback(
    (newType: FeeOption["type"]) => {
      setSelectedPreset(newType);
      const option = feeOptions.find(({ type }) => type === newType)!;
      if (option.amount) {
        onChange?.(option.amount);
      }
    },
    [onChange]
  );

  return (
    <div className="w-full flex flex-col mb-2">
      {label ? (
        <label
          className="mb-4 leading-tight flex flex-col"
          htmlFor={`${id}-select`}
        >
          <span className="text-base font-semibold text-gray-700">{label}</span>

          {labelDescription && (
            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              {labelDescription}
            </span>
          )}
        </label>
      ) : null}

      <div
        className={classNames(
          "relative",
          "mb-2",
          "flex flex-col items-stretch"
        )}
      >
        <CustomSelect
          activeItemId={selectedPreset}
          getItemId={getFeeOptionId}
          id={`${id}-select`}
          items={feeOptions}
          onSelect={handlePresetSelected}
          padding="0.2rem 0.375rem 0.2rem 0.375rem"
          OptionIcon={FeeOptionIcon}
          OptionContent={FeeOptionContent}
        />

        <AssetField
          containerClassName={classNames(
            selectedPreset !== "custom" && "hidden",
            "mt-6"
          )}
          id={id}
          onChange={onChange}
          assetSymbol={assetSymbol}
          value={value}
          {...restProps}
        />
      </div>
    </div>
  );
};

const FeeOptionIcon: React.FC<OptionRenderProps<FeeOption>> = ({
  item: { Icon },
}) => {
  if (Icon) {
    return (
      <Icon
        className="inline-block stroke-current"
        style={{ width: 32, height: 32 }}
      />
    );
  }

  return <div className="inline-block" style={{ width: 32, height: 32 }} />;
};

const FeeOptionContent: React.FC<OptionRenderProps<FeeOption>> = ({
  item: { description, amount },
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">{description}</Name>
      </div>

      <div
        className="flex flex-wrap items-center mt-1"
        text-xs
        leading-none
        text-gray-700
      >
        {amount && (
          <>
            <Money>{amount}</Money>{" "}
            <span className="text-xs">{XTZ_ASSET.symbol}</span>
          </>
        )}
      </div>
    </>
  );
};
