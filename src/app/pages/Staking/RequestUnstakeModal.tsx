import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { FormSecondaryButton, FormSubmitButton } from 'app/atoms';
import CustomModal from 'app/atoms/CustomModal';
import { useAppEnv } from 'app/env';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { StakeAmountField, FormData, convertFiatToAssetAmount } from 'app/templates/StakeAmountInput';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { T } from 'lib/i18n';
import { TEZOS_METADATA, useGasTokenMetadata } from 'lib/metadata';
import { useAccountPkh, useTezos } from 'lib/temple/front';
import { atomsToTokens } from 'lib/temple/helpers';

import { StakingPageSelectors } from './selectors';

interface Props {
  knownBakerName?: string;
  close: EmptyFn;
}

export const RequestUnstakeModal = memo<Props>(({ knownBakerName, close }) => {
  const { fullPage } = useAppEnv();

  const accountPkh = useAccountPkh();
  const tezos = useTezos();

  const { data: stakedAmount } = useStakedAmount(tezos.rpc.getRpcUrl(), accountPkh);

  const [inFiat, setInFiat] = useState(false);

  const { decimals } = useGasTokenMetadata();

  const maxAmountInTezos = useMemo(
    () => (stakedAmount ? atomsToTokens(stakedAmount, TEZOS_METADATA.decimals) : null),
    [stakedAmount]
  );

  const assetPrice = useAssetFiatCurrencyPrice(TEZ_TOKEN_SLUG);

  const form = useForm<FormData>({
    mode: 'onChange'
  });

  const { handleSubmit, errors } = form;

  const { trackSubmitSuccess, trackSubmitFail } = useFormAnalytics('UNSTAKE_REQUEST_FORM');

  const onSubmit = useCallback(
    ({ amount }: FormData) => {
      const tezosAmount = inFiat ? convertFiatToAssetAmount(amount, assetPrice, decimals) : amount;
      const inputAmount = Number(tezosAmount);

      const analyticsProps = {
        inputAmount,
        provider: knownBakerName
      };

      tezos.wallet
        .unstake({ amount: inputAmount })
        .send()
        .then(
          () => {
            close();
            trackSubmitSuccess(analyticsProps);
          },
          error => {
            console.error(error);
            if (error?.message === 'Declined') return;
            trackSubmitFail(analyticsProps);
          }
        );
    },
    [inFiat, tezos, close, trackSubmitSuccess, trackSubmitFail, knownBakerName, assetPrice, decimals]
  );

  const errorsInForm = Boolean(errors.amount);
  const disableSubmit = errorsInForm;

  return (
    <CustomModal isOpen={true} onRequestClose={close} className={clsx('w-full max-w-md', fullPage ? 'p-6' : 'p-4')}>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <StakeAmountField
          forUnstake
          inFiat={inFiat}
          maxAmountInTezos={maxAmountInTezos}
          assetPrice={assetPrice}
          accountPkh={accountPkh}
          setInFiat={setInFiat}
          {...form}
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
