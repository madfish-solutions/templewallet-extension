import React, { FC, ReactNode, useCallback, useEffect } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, SubmitErrorHandler, useForm } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button, Money } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { T, t, toLocalFixed } from 'lib/i18n';
import { useEvmGasMetadata } from 'lib/metadata';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { ZERO } from 'lib/utils/numbers';
import { DEFAULT_EVM_CURRENCY, EvmNetworkEssentials } from 'temple/networks';

import { EthStakingStats } from '../types';

import { ProviderCard } from './provider-card';

interface AmountInputContentProps {
  formId: string;
  submitButtonTestID: string;
  submitButtonLabel: ReactNode;
  maxAmountLabel: ReactNode;
  maxAmount: BigNumber;
  minAmount?: BigNumber;
  maxAmountLabelValue?: BigNumber;
  maxButtonTestID: string;
  amountInputTestID: string;
  placeholder: string;
  network: EvmNetworkEssentials;
  stats: EthStakingStats;
  onSubmit: SyncFn<FormValues>;
  onExceedMaxAmount?: EmptyFn;
  onBelowMinAmount?: EmptyFn;
  children?: ReactNode;
}

interface FormValues {
  amount: string;
}

export const AmountInputContent: FC<AmountInputContentProps> = ({
  formId,
  submitButtonLabel,
  submitButtonTestID,
  maxAmount,
  maxAmountLabel,
  maxAmountLabelValue = maxAmount,
  minAmount = ZERO,
  maxButtonTestID,
  amountInputTestID,
  placeholder,
  network,
  onSubmit,
  onExceedMaxAmount,
  onBelowMinAmount,
  children,
  stats
}) => {
  const { control, handleSubmit, formState, trigger, setValue, getValues } = useForm<FormValues>({
    defaultValues: { amount: '' }
  });
  const { decimals: ethDecimals, symbol: ethSymbol } = useEvmGasMetadata(network.chainId) ?? DEFAULT_EVM_CURRENCY;

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (Number(amount) === 0) return t('amountMustBePositive');

      const parsedAmount = new BigNumber(amount);

      if (parsedAmount.isLessThan(minAmount)) return t('minimalAmount', toLocalFixed(minAmount));

      return new BigNumber(amount).isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount, 6));
    },
    [maxAmount, minAmount]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.amount) {
      trigger('amount');
    }
  }, [formState.dirtyFields, trigger, maxAmountStr]);

  const cleanAmount = useCallback(() => setValue('amount', '', { shouldValidate: true }), [setValue]);
  const handleSetMaxAmount = useCallback(
    () => setValue('amount', maxAmountStr, { shouldValidate: true }),
    [setValue, maxAmountStr]
  );

  const handleInvalidSubmit = useCallback<SubmitErrorHandler<FormValues>>(() => {
    const parsedAmount = new BigNumber(getValues('amount'));

    if (parsedAmount.isGreaterThan(maxAmount)) {
      onExceedMaxAmount?.();
    }
    if (parsedAmount.isLessThan(minAmount)) {
      onBelowMinAmount?.();
    }
  }, [onExceedMaxAmount, maxAmount, getValues, onBelowMinAmount, minAmount]);

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        className="pt-4"
        actionsBoxProps={{
          children: (
            <StyledButton
              color="primary"
              size="L"
              type="submit"
              form={formId}
              disabled={shouldDisableSubmitButton({
                errors: formState.errors,
                formState,
                disableWhileSubmitting: false
              })}
              loading={formState.isSubmitting}
              testID={submitButtonTestID}
            >
              {submitButtonLabel}
            </StyledButton>
          )
        }}
      >
        <form id={formId} onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="flex flex-col">
          {children}

          <p className="mt-1 mb-2 text-font-description-bold">
            <T id="provider" />
          </p>
          <ProviderCard className="mb-6" stats={stats} />

          <div className="flex flex-col gap-1">
            <div className="flex my-1 justify-between gap-1">
              <span className="text-font-description-bold">
                <T id="amount" />
              </span>
              <div className="text-font-num-12 text-grey-1 min-w-0">
                {maxAmountLabel}:{' '}
                <Money fiat={false} smallFractionFont={false} tooltipPlacement="top">
                  {maxAmountLabelValue}
                </Money>{' '}
                {ethSymbol}
              </div>
            </div>
            <Controller
              name="amount"
              control={control}
              rules={{ validate: validateAmount }}
              render={({ field, fieldState, formState }) => (
                <AssetField
                  {...field}
                  extraFloatingInner={ethSymbol}
                  assetDecimals={ethDecimals}
                  readOnly={false}
                  placeholder={placeholder}
                  errorCaption={formState.submitCount > 0 ? fieldState.error?.message : undefined}
                  cleanable
                  floatAfterPlaceholder
                  onClean={cleanAmount}
                  rightSideComponent={
                    <Button
                      type="button"
                      onClick={handleSetMaxAmount}
                      className={clsx(
                        'flex justify-center items-center text-font-description-bold',
                        'text-white bg-primary hover:bg-primary-hover rounded-md py-1'
                      )}
                      style={{ width: '41px' }}
                      testID={maxButtonTestID}
                    >
                      <T id="max" />
                    </Button>
                  }
                  testID={amountInputTestID}
                />
              )}
            />
          </div>
        </form>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
};
