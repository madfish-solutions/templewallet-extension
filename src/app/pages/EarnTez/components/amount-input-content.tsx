import React, { FC, ReactNode, useCallback, useEffect } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button, Money } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { T, t, toLocalFixed } from 'lib/i18n';
import { useTezosGasMetadata } from 'lib/metadata';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { TezosNetworkEssentials } from 'temple/networks';

import { BakerCard } from './baker-card';

interface AmountInputContentProps {
  formId: string;
  submitButtonTestID: string;
  submitButtonLabel: ReactNode;
  maxAmountLabel: ReactNode;
  maxAmount: BigNumber;
  maxButtonTestID: string;
  amountInputTestID: string;
  network: TezosNetworkEssentials;
  bakerPkh: string;
  accountPkh: string;
  onSubmit: SyncFn<FormValues>;
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
  maxButtonTestID,
  amountInputTestID,
  network,
  bakerPkh,
  accountPkh,
  onSubmit,
  children
}) => {
  const { control, handleSubmit, formState, trigger, setValue } = useForm<FormValues>({
    defaultValues: { amount: '' }
  });
  const { symbol: tezSymbol, decimals: tezDecimals } = useTezosGasMetadata(network.chainId);

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (Number(amount) === 0) return t('amountMustBePositive');

      return new BigNumber(amount).isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount, 6));
    },
    [maxAmount]
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
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {children}

          <p className="mt-1 mb-2 text-font-description-bold">
            <T id="bakerInfo" />
          </p>
          <BakerCard
            baker={bakerPkh}
            className="mb-6"
            network={network}
            accountPkh={accountPkh}
            metricsType="staking"
          />

          <div className="flex flex-col gap-1">
            <div className="flex my-1 justify-between gap-1">
              <span className="text-font-description-bold">
                <T id="amount" />
              </span>
              <div className="text-font-num-12 text-grey-1 min-w-0">
                {maxAmountLabel}:{' '}
                <Money fiat={false} smallFractionFont={false} tooltipPlacement="top">
                  {maxAmount}
                </Money>{' '}
                {tezSymbol}
              </div>
            </div>
            <Controller
              name="amount"
              control={control}
              rules={{ validate: validateAmount }}
              render={({ field, fieldState, formState }) => (
                <AssetField
                  {...field}
                  extraFloatingInner={tezSymbol}
                  assetDecimals={tezDecimals}
                  readOnly={false}
                  placeholder="0.00"
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
