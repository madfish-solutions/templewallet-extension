import React, { memo, useCallback, useEffect, useState } from 'react';

import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { Controller, RegisterOptions, SubmitHandler, useForm } from 'react-hook-form-v7';

import { CaptionAlert } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox, PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { t, T } from 'lib/i18n';

type Option = '0.5' | '1' | 'custom';
const options = ['0.5', '1', 'custom'] as const;

interface SwapSettingForm {
  customSlippage?: number;
}

interface SelectTokenModalProps {
  currentSlippageTolerance: number;
  opened: boolean;
  onRequestClose: EmptyFn;
  onConfirm: SyncFn<number>;
}

export const SwapSettingsModal = memo<SelectTokenModalProps>(
  ({ currentSlippageTolerance, opened, onRequestClose, onConfirm }) => {
    const [selectedOption, setSelectedOption] = useState(getOptionFromSlippage(currentSlippageTolerance));

    const {
      watch,
      control,
      handleSubmit,
      setValue,
      setError,
      formState: { errors, submitCount, isSubmitting }
    } = useForm<SwapSettingForm>({
      mode: 'onSubmit',
      reValidateMode: 'onChange'
    });

    const customSlippageValue = watch('customSlippage');
    const formSubmitted = submitCount > 0;

    const resetSelectedOption = useCallback(() => {
      const option = getOptionFromSlippage(currentSlippageTolerance);

      setSelectedOption(option);
      setValue('customSlippage', option === 'custom' ? currentSlippageTolerance : undefined);
    }, [currentSlippageTolerance, setValue]);

    useEffect(() => {
      if (opened) resetSelectedOption();
    }, [opened]);

    const handleOptionChange = useCallback(
      (option: Option) => {
        if (option === 'custom') {
          control.register('customSlippage', customSlippageFieldOptions);
        } else control.unregister('customSlippage');

        setSelectedOption(option);
      },
      [control]
    );

    const handleInputClean = useCallback(
      () => void setValue('customSlippage', undefined, { shouldValidate: formSubmitted }),
      [setValue, formSubmitted]
    );

    const handleModalClose = useCallback(() => {
      resetSelectedOption();
      onRequestClose();
    }, [onRequestClose, resetSelectedOption]);

    const onSubmit = useCallback<SubmitHandler<SwapSettingForm>>(
      ({ customSlippage }) => {
        if (isSubmitting) return;

        if (selectedOption !== 'custom') {
          onConfirm(Number(selectedOption));
          return;
        }

        if (!customSlippage) {
          setError('customSlippage', { message: t('required') });
          return;
        }

        onConfirm(customSlippage);
      },
      [isSubmitting, onConfirm, selectedOption, setError]
    );

    return (
      <PageModal title="Swap Settings" opened={opened} onRequestClose={handleModalClose}>
        <div className="mt-5 px-4">
          <span className="font-semibold text-xs">
            <T id="slippageTolerance" />
          </span>

          <CaptionAlert className="mt-1" type="info" message={t('slippageDescription')} />

          <div className="flex items-center bg-[#E2E2E2] rounded-lg p-0.5 my-4">
            {options.map(option => (
              <button
                type="button"
                key={option}
                onClick={() => handleOptionChange(option)}
                className={clsx(
                  'flex-1 py-1 rounded-lg transition-all duration-200 text-sm font-semibold',
                  selectedOption === option ? 'bg-white text-primary shadow-sm' : 'text-text'
                )}
              >
                {option === 'custom' ? t('custom') : option + '%'}
              </button>
            ))}
          </div>

          <form id="slippage-form" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="customSlippage"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <div className={selectedOption === 'custom' ? 'w-full' : 'hidden'}>
                  <AssetField
                    value={value}
                    onChange={v => onChange(v ? Number(v) : undefined)}
                    onBlur={onBlur}
                    assetDecimals={2}
                    cleanable={Boolean(customSlippageValue)}
                    onClean={handleInputClean}
                    placeholder={'0.1 - 30'}
                    errorCaption={formSubmitted ? errors.customSlippage?.message : null}
                    containerClassName="pb-8"
                  />
                </div>
              )}
            />
          </form>
        </div>
        <ActionsButtonsBox bgSet={false} className="mt-auto">
          <StyledButton
            type="submit"
            form="slippage-form"
            size="L"
            color="primary"
            loading={isSubmitting}
            disabled={formSubmitted && !isEmpty(errors)}
          >
            Apply
          </StyledButton>
        </ActionsButtonsBox>
      </PageModal>
    );
  }
);

const customSlippageFieldOptions: RegisterOptions<SwapSettingForm> = {
  required: t('required'),
  validate: {
    maxSlippage: value => (value && value > 30 ? t('maxSlippage', '30') : true),
    minSlippage: value => (value && value < 0.1 ? t('minSlippage', '0.1') : true)
  }
};

const getOptionFromSlippage = (slippage: number) => {
  const slippageStr = slippage.toString() as Option;

  return options.includes(slippageStr) ? slippageStr : 'custom';
};
