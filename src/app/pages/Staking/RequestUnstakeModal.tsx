import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { FormSecondaryButton, FormSubmitButton } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import CustomModal from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { t, T, toLocalFixed } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useAccountPkh, useTezos } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';

import { StakingPageSelectors } from './selectors';

interface Props {
  close: EmptyFn;
}

export const RequestUnstakeModal = memo<Props>(({ close }) => {
  const { fullPage } = useAppEnv();

  const accountPkh = useAccountPkh();
  const tezos = useTezos();

  const { data: stakedAmount } = useStakedAmount(tezos.rpc.getRpcUrl(), accountPkh);

  const maxAmount = stakedAmount ? atomsToTokens(stakedAmount, TEZOS_METADATA.decimals) : null;

  const { handleSubmit, errors, control, setValue, triggerValidation } = useForm<FormData>({
    mode: 'onChange'
  });

  const amountRules = useMemo(
    () => ({
      validate: (val?: string) => {
        if (val == null) return t('required');
        if (Number(val) === 0) {
          return t('amountMustBePositive');
        }
        if (!maxAmount) return true;
        const vBN = new BigNumber(val);
        return vBN.isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount));
      }
    }),
    [maxAmount]
  );

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.toString());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const onSubmit = useCallback(
    ({ amount }: FormData) => {
      tezos.wallet
        .unstake({ amount: Number(amount) })
        .send()
        .then(
          () => void close(),
          err => void console.error(err)
        );
    },
    [tezos, close]
  );

  const labelDescription = useMemo(() => {
    if (!maxAmount) return null;

    return (
      <>
        <span>Available amount: </span>

        <button type="button" className="underline" onClick={handleSetMaxAmount}>
          {`${toLocalFixed(maxAmount)} ${TEZOS_METADATA.symbol}`}
        </button>
      </>
    );
  }, [maxAmount, handleSetMaxAmount]);

  const errorsInForm = Boolean(errors.amount);
  const disableSubmit = errorsInForm;

  return (
    <CustomModal isOpen={true} onRequestClose={close} className={clsx('w-full max-w-md', fullPage ? 'p-6' : 'p-4')}>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          as={AssetField}
          name="amount"
          control={control}
          rules={amountRules}
          assetSymbol={TEZOS_METADATA.symbol}
          assetDecimals={TEZOS_METADATA.decimals}
          label={`Unstake ${TEZOS_METADATA.symbol}`}
          labelDescription={labelDescription}
          placeholder={t('amountPlaceholder')}
          errorCaption={errors.amount?.message}
          autoFocus
        />

        <div className="text-xs leading-5 text-gray-500">
          Unstake requests will be processed after cooldown period ends
        </div>

        <div className="mt-6 h-10 flex gap-x-4">
          <FormSecondaryButton onClick={close} unsetHeight rounder className="flex-1">
            <T id="cancel" />
          </FormSecondaryButton>

          <FormSubmitButton
            type="submit"
            disabled={disableSubmit}
            unsetHeight
            rounder
            className="flex-1"
            testID={StakingPageSelectors.confirmUnstakeRequestBtn}
          >
            Unstake
          </FormSubmitButton>
        </div>
      </form>
    </CustomModal>
  );
});

interface FormData {
  amount: string;
}
