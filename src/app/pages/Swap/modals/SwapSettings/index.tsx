import React, { memo, useCallback, useState } from 'react';

import { isEmpty } from 'lodash';
import { Controller, SubmitHandler, useForm } from 'react-hook-form-v7';

import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox, PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as InfoIcon } from 'app/icons/info-icon.svg';
import { T } from 'lib/i18n';

export type Inputs = {
  slippageTolerance: number | undefined;
};

interface SelectTokenModalProps {
  onSubmit: SubmitHandler<Inputs>;
  opened: boolean;
  onRequestClose: EmptyFn;
}

const SwapSettingsModal = memo<SelectTokenModalProps>(({ onSubmit, opened, onRequestClose }) => {
  const options = [0.5, 1, 'Custom'] as const;
  const [selected, setSelected] = useState<(typeof options)[number]>(0.5);

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

  const handleOptionChange = (option: (typeof options)[number]) => {
    setSelected(option);
    if (option === 'Custom') {
      setValue('slippageTolerance', undefined, { shouldValidate: formSubmitted });
    } else if (option === 0.5 || option === 1) {
      setValue('slippageTolerance', option, { shouldValidate: formSubmitted });
    }
  };

  const handleApplyClick = () => {
    if (selected !== 'Custom') {
      setValue('slippageTolerance', selected, { shouldValidate: formSubmitted });
    }
    handleSubmit(onSubmit)();
  };

  return (
    <PageModal title="Swap Settings" opened={opened} onRequestClose={onRequestClose}>
      <div className="mt-5 px-4">
        <span className="font-semibold text-xs">
          <T id="slippageTolerance" />
        </span>

        <div className="bg-secondary-low rounded-6 p-3 flex gap-1 items-start mt-2">
          <InfoIcon className="min-w-5 min-h-5 mt-0.5" />
          <span className="text-xs">
            The swap will fail if the price changes unfavorably by more than this percentage. Too high value may lead to
            an unfavorable trade.
          </span>
        </div>

        <form id="slippage-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center bg-[#E2E2E2] rounded-lg p-0.5 my-4">
            {options.map(option => (
              <button
                type="button"
                key={option}
                onClick={() => handleOptionChange(option)}
                className={`flex-1 py-1 rounded-lg transition-all duration-200 text-sm font-semibold
            ${selected === option ? 'bg-white text-primary shadow-sm' : 'text-text'}`}
              >
                {option}
                {option !== 'Custom' && '%'}
              </button>
            ))}
          </div>
          {selected === 'Custom' && (
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
