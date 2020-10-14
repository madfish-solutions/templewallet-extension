import classNames from "clsx";
import React, { useCallback, useRef, useState } from "react";
import { Controller, ControllerProps, FieldError } from "react-hook-form";
import BigNumber from "bignumber.js";
import { XTZ_ASSET } from "lib/thanos/front";
import { T, useTranslation } from "lib/ui/i18n";
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
  descriptionI18nKey: string;
  type: "minimal" | "fast" | "rocket" | "custom";
  amount?: number;
};

const feeOptions: FeeOption[] = [
  {
    Icon: CoffeeIcon,
    descriptionI18nKey: "minimalFeeDescription",
    type: "minimal",
    amount: 1e-4,
  },
  {
    Icon: ({ className, ...rest }) => (
      <CupIcon
        className={classNames("transform scale-95", className)}
        {...rest}
      />
    ),
    descriptionI18nKey: "fastFeeDescription",
    type: "fast",
    amount: 3e-4,
  },
  {
    Icon: RocketIcon,
    descriptionI18nKey: "rocketFeeDescription",
    type: "rocket",
    amount: 5e-4,
  },
  {
    Icon: ({ className, ...rest }) => (
      <SettingsIcon
        className={classNames("transform scale-95", className)}
        {...rest}
      />
    ),
    descriptionI18nKey: "customFeeDescription",
    type: "custom",
  },
];

const getFeeOptionId = (option: FeeOption) => option.type;

const AdditionalFeeInput: React.FC<AdditionalFeeInputProps> = (props) => {
  const { assetSymbol, baseFee, control, error, id, name, onChange } = props;
  const { t } = useTranslation();

  const validateAdditionalFee = useCallback((v?: number) => {
    if (v === undefined) {
      return "Required";
    }
    if (v <= 0) {
      return "Must be positive";
    }
    return true;
  }, []);

  const customFeeInputRef = useRef<HTMLInputElement>(null);
  const focusCustomFeeInput = useCallback(() => {
    customFeeInputRef.current?.focus();
  }, []);

  return (
    <Controller
      name={name}
      as={AdditionalFeeInputContent}
      control={control}
      customFeeInputRef={customFeeInputRef}
      onChange={onChange}
      id={id}
      assetSymbol={assetSymbol}
      onFocus={focusCustomFeeInput}
      label={t("additionalFee")}
      labelDescription={
        baseFee instanceof BigNumber && (
          <T
            id="feeInputDescription"
            substitutions={[
              <React.Fragment key={0}>
                <span className="font-normal">{baseFee.toString()}</span>
              </React.Fragment>,
            ]}
          />
        )
      }
      placeholder="0"
      errorCaption={error?.message}
      rules={{
        validate: validateAdditionalFee,
      }}
    />
  );
};

export default AdditionalFeeInput;

type AdditionalFeeInputContentProps = AssetFieldProps & {
  customFeeInputRef: React.MutableRefObject<HTMLInputElement | null>;
};

const AdditionalFeeInputContent: React.FC<AdditionalFeeInputContentProps> = (
  props
) => {
  const {
    className,
    containerClassName,
    customFeeInputRef,
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
          ref={customFeeInputRef}
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
        className="flex-none inline-block stroke-current opacity-90"
        style={{ width: 24, height: 24 }}
      />
    );
  }

  return <div style={{ width: 24, height: 24 }} />;
};

const FeeOptionContent: React.FC<OptionRenderProps<FeeOption>> = ({
  item: { descriptionI18nKey, amount },
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center">
        <T id={descriptionI18nKey}>
          {(message) => (
            <Name className="w-16 text-sm font-medium leading-tight text-left">
              {message}
            </Name>
          )}
        </T>

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
