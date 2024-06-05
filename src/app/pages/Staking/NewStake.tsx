import React, { memo, useCallback, useMemo, useState } from 'react';

import { WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form';

import { Alert } from 'app/atoms';
import { StakeButton } from 'app/atoms/BakingButtons';
import { useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import OperationStatus from 'app/templates/OperationStatus';
import { StakeAmountField, FormData, convertFiatToAssetAmount } from 'app/templates/StakeAmountInput';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import { useGasTokenMetadata } from 'lib/metadata';
import { useAccount, useDelegate, useKnownBaker, useTezos } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';

export const NewStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();

  const { value: balance } = useBalance(TEZ_TOKEN_SLUG, acc.publicKeyHash);

  const maxAmountInTezos = useMemo(() => {
    if (!balance) return null;

    return BigNumber.max(balance.minus(MINIMAL_FEE), 0);
  }, [balance]);

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);
  const { data: knownBaker } = useKnownBaker(myBakerPkh || null, false);
  const knownBakerName = knownBaker?.name;

  const [operation, setOperation] = useSafeState<WalletOperation | null>(null, tezos.checksum);

  const requestsSwr = useUnstakeRequests(tezos.rpc.getRpcUrl(), acc.publicKeyHash, true);

  const pendingRequestsForAnotherBaker = useMemo(() => {
    if (!myBakerPkh || !requestsSwr.data) return false;
    const { finalizable, unfinalizable } = requestsSwr.data;

    if (unfinalizable.delegate && unfinalizable.delegate !== myBakerPkh) return true;

    return finalizable.length ? finalizable.some(r => r.delegate !== myBakerPkh) : false;
  }, [requestsSwr.data, myBakerPkh]);

  const form = useForm<FormData>({
    mode: 'onChange'
  });
  const { handleSubmit, errors, reset } = form;

  const { trackSubmitSuccess, trackSubmitFail } = useFormAnalytics('STAKE_FOR_BAKER_FORM');

  const [inFiat, setInFiat] = useState(false);

  const assetPrice = useAssetFiatCurrencyPrice(TEZ_TOKEN_SLUG);

  const { decimals } = useGasTokenMetadata();

  const onSubmit = useCallback(
    ({ amount }: FormData) => {
      const tezosAmount = inFiat ? convertFiatToAssetAmount(amount, assetPrice, decimals) : amount;
      const inputAmount = Number(tezosAmount);

      const analyticsProps = {
        inputAmount,
        provider: knownBakerName
      };

      tezos.wallet
        .stake({ amount: inputAmount })
        .send()
        .then(
          operation => {
            setOperation(operation);
            reset();
            trackSubmitSuccess(analyticsProps);
          },
          error => {
            console.error(error);
            if (error?.message === 'Declined') return;
            trackSubmitFail(analyticsProps);
          }
        );
    },
    [tezos, setOperation, reset, trackSubmitSuccess, trackSubmitFail, inFiat, assetPrice, knownBakerName, decimals]
  );

  const errorsInForm = Boolean(errors.amount);
  const disableSubmit = cannotDelegate || pendingRequestsForAnotherBaker || errorsInForm || Boolean(operation);

  return (
    <div className="mx-auto max-w-sm flex flex-col gap-y-8 pb-4">
      {operation && <OperationStatus typeTitle={t('stake')} operation={operation} />}

      {pendingRequestsForAnotherBaker && (
        <Alert
          type="warning"
          title="Pending unstake"
          description="You've got an unstake request ongoing. New stake will be available after unstake request is finalized."
        />
      )}

      <div className="flex flex-col gap-y-4">
        <span className="text-base font-medium text-blue-750">Current Baker</span>

        {myBakerPkh ? <BakerBanner bakerPkh={myBakerPkh} /> : <div className={BAKER_BANNER_CLASSNAME}>---</div>}
      </div>

      <form className="flex flex-col gap-y-4" onSubmit={handleSubmit(onSubmit)}>
        <StakeAmountField
          inFiat={inFiat}
          maxAmountInTezos={maxAmountInTezos}
          assetPrice={assetPrice}
          accountPkh={acc.publicKeyHash}
          setInFiat={setInFiat}
          disabled={disableSubmit}
          {...form}
        />

        <StakeButton type="submit" disabled={disableSubmit} />
      </form>
    </div>
  );
});

/** Just to be able to apply 'Max Amount' & not fail estimation on confirm */
const MINIMAL_FEE = 1e-4;
