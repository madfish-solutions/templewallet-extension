import classNames from "clsx";
import React, { useCallback, useState } from "react";
import { Controller, ControllerProps, FieldError } from "react-hook-form";
import BigNumber from "bignumber.js";
import { XTZ_ASSET } from "lib/thanos/front";
import AssetField from "app/atoms/AssetField";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import { ReactComponent as CoffeeIcon } from "app/icons/coffee.svg";
import { ReactComponent as CupIcon } from "app/icons/cup.svg";
import { ReactComponent as RocketIcon } from "app/icons/rocket.svg";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";

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
  baseFee?: BigNumber | Error;
  error?: FieldError;
  id: string;
};

type FeeOption = {
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  description: string;
  type: "minimal" | "fast" | "rocket" | "custom";
  amount?: number;
};

const feeOptions: FeeOption[] = [
  { Icon: CoffeeIcon, description: "Minimal", type: "minimal", amount: 1e-4 },
  {
    Icon: ({ className, ...rest }) => (
      <CupIcon
        className={classNames("transform scale-95", className)}
        {...rest}
      />
    ),
    description: "Fast",
    type: "fast",
    amount: 3e-4,
  },
  { Icon: RocketIcon, description: "Rocket", type: "rocket", amount: 5e-4 },
  {
    Icon: ({ className, ...rest }) => (
      <SettingsIcon
        className={classNames("transform scale-95", className)}
        {...rest}
      />
    ),
    description: "Custom",
    type: "custom",
  },
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
            Additional - speeds up its confirmation
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
    <div className="flex flex-col w-full mb-2">
      {label ? (
        <label
          className="flex flex-col mb-4 leading-tight"
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

      <div className="relative flex flex-col items-stretch">
        <CustomSelect
          activeItemId={selectedPreset}
          className="mb-4"
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
            "mb-2"
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
  item: { Icon, type },
}) => {
  if (Icon) {
    return (
      <Icon
        className="inline-block stroke-current opacity-90 flex-none"
        style={{ width: 24, height: 24 }}
      />
    );
  }

  return <div style={{ width: 24, height: 24 }} />;
};

const FeeOptionContent: React.FC<OptionRenderProps<FeeOption>> = ({
  item: { description, amount },
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="w-16 text-sm font-medium leading-tight text-left">
          {description}
        </Name>

        {amount && (
          <div className="ml-2 leading-none text-gray-600">
            <Money>{amount}</Money>{" "}
            <span style={{ fontSize: "0.75em" }}>{XTZ_ASSET.symbol}</span>
          </div>
        )}
      </div>
    </>
  );
};
