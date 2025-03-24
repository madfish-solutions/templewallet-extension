import React, { memo, useCallback, useEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Alert, Button, Money } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { T, t, toLocalFixed } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { mutezToTz } from 'lib/temple/helpers';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials } from 'temple/networks';

import { BakerCard } from '../../components/baker-card';

import { UnstakeModalSelectors } from './selectors';

interface FormValues {
  amount: string;
}

interface AmountInputContentProps {
  account: AccountForTezos;
  bakerPkh: string;
  network: TezosNetworkEssentials;
  onSubmit: SyncFn<FormValues>;
}

export const AmountInputContent = memo<AmountInputContentProps>(({ account, bakerPkh, network, onSubmit }) => {
  const { address: accountPkh } = account;
  const { rpcBaseURL } = network;
  const { control, handleSubmit, formState, trigger, setValue } = useForm<FormValues>({
    defaultValues: { amount: '' }
  });
  const { symbol: tezSymbol, decimals: tezDecimals } = getTezosGasMetadata(network.chainId);

  const { data: stakedAtomicAmount } = useStakedAmount(rpcBaseURL, accountPkh, true);

  const maxAmount = useMemo(() => mutezToTz(stakedAtomicAmount ?? ZERO), [stakedAtomicAmount]);

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

  const cleanAmount = useCallback(() => setValue('amount', ''), [setValue]);
  const handleSetMaxAmount = useCallback(() => setValue('amount', maxAmountStr), [setValue, maxAmountStr]);

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
              form="unstake-amount-form"
              disabled={shouldDisableSubmitButton({
                errors: formState.errors,
                formState,
                disableWhileSubmitting: false
              })}
              loading={formState.isSubmitting}
              testID={UnstakeModalSelectors.unstakeButton}
            >
              <T id="unstake" />
            </StyledButton>
          )
        }}
      >
        <form id="unstake-amount-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          <Alert className="mb-4" type="info" description={<T id="newUnstakeInfo" />} />

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
                <T id="available" />:{' '}
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
                      testID={UnstakeModalSelectors.maxButton}
                    >
                      <T id="max" />
                    </Button>
                  }
                  testID={UnstakeModalSelectors.amountInput}
                />
              )}
            />
          </div>
        </form>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});
