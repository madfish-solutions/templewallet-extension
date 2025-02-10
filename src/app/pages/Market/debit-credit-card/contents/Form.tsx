import React, { FC, memo, useCallback } from 'react';

import clsx from 'clsx';
import { Controller, FieldError, SubmitHandler, useFormContext } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';

import { InfoCard } from '../components/InfoCard';
import { SelectAssetButton } from '../components/SelectAssetButton';
import { SelectProviderButton } from '../components/SelectProviderButton';
import { FormData, VALUE_PLACEHOLDER } from '../config';
import { TopUpProviderId } from '../top-up-provider-id.enum';

const MIN_ERROR = 'min';
const MAX_ERROR = 'max';

interface Props {
  setModalContent: SyncFn<'send' | 'get' | 'provider'>;
}

export const Form: FC<Props> = ({ setModalContent }) => {
  //const formAnalytics = useFormAnalytics('BuyWithDebitCreditCardForm');

  const {
    control,
    watch,
    handleSubmit
    //formState, trigger
  } = useFormContext<FormData>();
  //const { isSubmitting, submitCount, errors } = formState;

  const inputCurrency = watch('inputCurrency');
  const outputCurrency = watch('outputToken');

  const handleSelectCurrency = useCallback(() => void setModalContent('send'), []);
  const handleSelectToken = useCallback(() => void setModalContent('get'), []);
  const handleSelectProvider = useCallback(() => void setModalContent('provider'), []);

  const onSubmit = useCallback<SubmitHandler<FormData>>(() => 1, []);

  return (
    <FadeTransition>
      <form id="main-form" className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="inputValue"
          control={control}
          rules={{ validate: () => true }}
          render={({ field: { value, onChange, onBlur }, formState: { errors } }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              assetDecimals={inputCurrency.precision}
              rightSideComponent={<SelectAssetButton currency={inputCurrency} onClick={handleSelectCurrency} />}
              rightSideContainerStyle={{ right: 2 }}
              style={{ paddingRight: 158 }}
              underneathComponent={
                <MinMaxDisplay
                  currencyCode={inputCurrency.code}
                  //min={minMaxData?.finalMinAmount}
                  //max={minMaxData?.finalMaxAmount}
                  error={errors.inputValue}
                />
              }
              label={t('send')}
              placeholder="0.00"
              containerClassName="pb-6"
            />
          )}
        />

        <AssetField
          readOnly
          //value={toAmount === 0 ? '' : toAmount}
          assetDecimals={outputCurrency.precision}
          rightSideComponent={<SelectAssetButton currency={outputCurrency} onClick={handleSelectToken} />}
          rightSideContainerStyle={{ right: 2 }}
          style={{ paddingRight: 158 }}
          label={t('get')}
          placeholder="0.00"
          shouldShowErrorCaption={false}
          containerClassName="pb-8"
        />

        <div className="flex flex-row justify-between py-1 mb-1">
          <span className="text-font-description-bold">
            <T id="provider" />
          </span>

          <span>
            <span className="text-font-description text-grey-2 mr-0.5">New Quote:</span>
            <span className="w-7 inline-block text-font-description-bold text-end">0:22</span>
          </span>
        </div>

        <SelectProviderButton providerId={TopUpProviderId.MoonPay} onClick={handleSelectProvider} />

        <InfoCard
          rate={0.35}
          inputCurrencyCode={inputCurrency.code}
          outputCurrencyCode={outputCurrency.code}
          className="mt-6"
        />
      </form>

      <ActionsButtonsBox>
        <StyledButton
          type="submit"
          form="main-form"
          size="L"
          color="primary"
          //loading={isSubmitting || isMinMaxLoading || isRatesLoading}
          //disabled={formSubmitted && (!toAmount || !isEmpty(errors))}
        >
          <T id="topUp" />
        </StyledButton>
      </ActionsButtonsBox>
    </FadeTransition>
  );
};

const COMMON_TEXT_CLASSNAME = 'cursor-pointer text-font-num-12 ml-0.5';

interface MinMaxDisplayProps {
  currencyCode: string;
  error?: FieldError;
  min?: number;
  max?: number;
}

const MinMaxDisplay = memo<MinMaxDisplayProps>(({ currencyCode, error, min, max }) => {
  const isMinError = error?.message === MIN_ERROR;
  const ismMaxError = error?.message === MAX_ERROR;

  const { setValue } = useFormContext<FormData>();

  const handleMinClick = useCallback(
    () => min && setValue('inputValue', min.toString(), { shouldValidate: true }),
    [min, setValue]
  );
  const handleMaxClick = useCallback(
    () => max && setValue('inputValue', max.toString(), { shouldValidate: true }),
    [max, setValue]
  );

  return (
    <div className="flex items-center text-font-description text-grey-1 py-1">
      <T id="min" />{' '}
      <span
        className={clsx('mr-4', COMMON_TEXT_CLASSNAME, getMinMaxTextClassNames(isMinError, min))}
        onClick={handleMinClick}
      >
        {getMinMaxDisplayValue(currencyCode, min)}
      </span>
      <T id="max" />:{' '}
      <span className={clsx(COMMON_TEXT_CLASSNAME, getMinMaxTextClassNames(ismMaxError, max))} onClick={handleMaxClick}>
        {getMinMaxDisplayValue(currencyCode, max)}
      </span>
    </div>
  );
});

const getMinMaxDisplayValue = (currencyCode: string, value?: number) =>
  value ? `${value} ${currencyCode}` : VALUE_PLACEHOLDER;

const getMinMaxTextClassNames = (isError: boolean, value?: number) =>
  value ? (isError ? 'text-error underline' : 'text-secondary') : '';
