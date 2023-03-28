import React, {
  ComponentType,
  FC,
  ForwardRefExoticComponent,
  Fragment,
  FunctionComponent,
  MutableRefObject,
  SVGProps,
  useCallback,
  useRef,
  useState
} from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, ControllerProps, EventFunction, FieldError } from 'react-hook-form';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { ReactComponent as CoffeeIcon } from 'app/icons/coffee.svg';
import { ReactComponent as CupIcon } from 'app/icons/cup.svg';
import { ReactComponent as RocketIcon } from 'app/icons/rocket.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { TID, toLocalFixed, T, t } from 'lib/i18n';
import { useGasToken } from 'lib/temple/front';

import { AdditionalFeeInputSelectors } from './AdditionalFeeInput.selectors';

type AssetFieldProps = typeof AssetField extends ForwardRefExoticComponent<infer T> ? T : never;

type AdditionalFeeInputProps = Pick<ControllerProps<ComponentType>, 'name' | 'control' | 'onChange'> & {
  assetSymbol: string;
  baseFee?: BigNumber | Error;
  error?: FieldError;
  id: string;
};

type FeeOption = {
  Icon?: FunctionComponent<SVGProps<SVGSVGElement>>;
  descriptionI18nKey: TID;
  type: 'minimal' | 'fast' | 'rocket' | 'custom';
  amount?: number;
};

const feeOptions: FeeOption[] = [
  {
    Icon: CoffeeIcon,
    descriptionI18nKey: 'minimalFeeDescription',
    type: 'minimal',
    amount: 1e-4
  },
  {
    Icon: ({ className, ...rest }) => <CupIcon className={classNames('transform scale-95', className)} {...rest} />,
    descriptionI18nKey: 'fastFeeDescription',
    type: 'fast',
    amount: 1.5e-4
  },
  {
    Icon: RocketIcon,
    descriptionI18nKey: 'rocketFeeDescription',
    type: 'rocket',
    amount: 2e-4
  },
  {
    Icon: ({ className, ...rest }) => (
      <SettingsIcon className={classNames('transform scale-95', className)} {...rest} />
    ),
    descriptionI18nKey: 'customFeeDescription',
    type: 'custom'
  }
];

const getFeeOptionId = (option: FeeOption) => option.type;

const AdditionalFeeInput: FC<AdditionalFeeInputProps> = props => {
  const { assetSymbol, baseFee, control, id, name, onChange } = props;
  const { trackEvent } = useAnalytics();

  const customFeeInputRef = useRef<HTMLInputElement>(null);
  const focusCustomFeeInput = useCallback(() => {
    customFeeInputRef.current?.focus();
  }, []);

  const handleChange: EventFunction = event => {
    trackEvent(AdditionalFeeInputSelectors.FeeButton, AnalyticsEventCategory.ButtonPress);

    return onChange?.(event);
  };

  return (
    <Controller
      name={name}
      as={AdditionalFeeInputContent}
      control={control}
      customFeeInputRef={customFeeInputRef}
      onChange={handleChange}
      id={id}
      assetSymbol={assetSymbol}
      onFocus={focusCustomFeeInput}
      label={t('additionalFee')}
      labelDescription={
        baseFee instanceof BigNumber && (
          <T
            id="feeInputDescription"
            substitutions={[
              <Fragment key={0}>
                <span className="font-normal">{toLocalFixed(baseFee)}</span>
              </Fragment>
            ]}
          />
        )
      }
      placeholder="0"
    />
  );
};

export default AdditionalFeeInput;

type AdditionalFeeInputContentProps = AssetFieldProps & {
  customFeeInputRef: MutableRefObject<HTMLInputElement | null>;
};

const AdditionalFeeInputContent: FC<AdditionalFeeInputContentProps> = props => {
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

  const [selectedPreset, setSelectedPreset] = useState<FeeOption['type']>(
    feeOptions.find(({ amount }) => amount === value)?.type || 'custom'
  );
  const handlePresetSelected = useCallback(
    (newType: FeeOption['type']) => {
      setSelectedPreset(newType);
      const option = feeOptions.find(({ type }) => type === newType)!;
      if (option.amount) {
        onChange?.(`${option.amount}`);
      }
    },
    [onChange]
  );

  return (
    <div className="flex flex-col w-full mb-2">
      {label ? (
        <label className="flex flex-col mb-4 leading-tight" htmlFor={`${id}-select`}>
          <span className="text-base font-semibold text-gray-700">{label}</span>

          {labelDescription && (
            <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">{labelDescription}</span>
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
          containerClassName={classNames(selectedPreset !== 'custom' && 'hidden', 'mb-2')}
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

const FeeOptionIcon: FC<OptionRenderProps<FeeOption>> = ({ item: { Icon } }) => {
  if (Icon) {
    return <Icon className="flex-none inline-block stroke-current opacity-90" style={{ width: 24, height: 24 }} />;
  }

  return <div style={{ width: 24, height: 24 }} />;
};

const FeeOptionContent: FC<OptionRenderProps<FeeOption>> = ({ item: { descriptionI18nKey, amount } }) => {
  const { metadata } = useGasToken();

  return (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="w-16 text-sm font-medium leading-tight text-left">
          <T id={descriptionI18nKey} />
        </Name>

        {amount && (
          <div className="ml-2 leading-none text-gray-600 flex items-baseline">
            <Money cryptoDecimals={5}>{amount}</Money>{' '}
            <span className="ml-1" style={{ fontSize: '0.75em' }}>
              {metadata.symbol}
            </span>
          </div>
        )}
      </div>
    </>
  );
};
