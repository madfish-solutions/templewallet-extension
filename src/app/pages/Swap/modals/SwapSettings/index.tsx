import React, { memo, useCallback, useState } from 'react';

import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form-v7';

import { CaptionAlert } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox, PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { t, T } from 'lib/i18n';

export type Inputs = {
  slippageTolerance?: number;
};

interface SelectTokenModalProps {
  onSubmit: SubmitHandler<Inputs>;
  opened: boolean;
  onRequestClose: EmptyFn;
}

const SwapSettingsModal = memo<SelectTokenModalProps>(({ onSubmit, opened, onRequestClose }) => {
  const customLabel = t('custom');
  const options: (number | typeof customLabel)[] = [0.5, 1, customLabel];
  const [selectedOption, setSelectedOption] = useState<number | typeof customLabel>(0.5);

  type SlippageOption = (typeof options)[number];

  const {
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { errors, submitCount, isSubmitting }
  } = useForm<Inputs>();
  const formSubmitted = submitCount > 0;

  const slippageValue = watch('slippageTolerance');

  const handleInputClean = useCallback(
    () => setValue('slippageTolerance', undefined, { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handleOptionChange = (option: SlippageOption) => {
    setSelectedOption(option);
    setValue('slippageTolerance', typeof option === 'number' ? option : undefined, { shouldValidate: formSubmitted });
  };

  const handleApplyClick = () => {
    if (typeof selectedOption === 'number') {
      setValue('slippageTolerance', selectedOption, { shouldValidate: formSubmitted });
    }
    handleSubmit(onSubmit)();
  };

  return (
    <PageModal title="Swap Settings" opened={opened} onRequestClose={onRequestClose}>
      <div className="mt-5 px-4">
        <span className="font-semibold text-xs">
          <T id="slippageTolerance" />
        </span>

        <CaptionAlert className="mt-1" type="info" message={t('slippageDescription')} />

        <form id="slippage-form" onSubmit={handleSubmit(onSubmit)}>
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
                {option}
                {option !== customLabel && '%'}
              </button>
            ))}
          </div>
          {selectedOption === customLabel && (
            <Controller
              name="slippageTolerance"
              control={control}
              rules={{
                required: true,
                validate: {
                  maxSlippage: value => {
                    if (value && value > 30) {
                      return 'Max slippage is 30%';
                    }
                    return true;
                  },
                  minSlippage: value => {
                    if (value && value < 0.1) {
                      return 'Min slippage is 0.1%';
                    }
                    return true;
                  }
                }
              }}
              render={({ field: { value, onChange, onBlur } }) => (
                <AssetField
                  value={value}
                  onChange={v => onChange(v ?? '')}
                  onBlur={onBlur}
                  assetDecimals={2}
                  cleanable={Boolean(slippageValue)}
                  onClean={handleInputClean}
                  placeholder={'0.1 - 30'}
                  errorCaption={formSubmitted ? errors.slippageTolerance?.message : null}
                  containerClassName="pb-8"
                />
              )}
            />
          )}
        </form>
      </div>
      <ActionsButtonsBox bgSet={false} className="mt-auto">
        <StyledButton
          type="button"
          onClick={handleApplyClick}
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
});

export default SwapSettingsModal;
