import React, { memo, useCallback, useMemo, useState } from 'react';

import { WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form';

import { Alert } from 'app/atoms';
import { StakeButton } from 'app/atoms/BakingButtons';
import { useIsStakingNotSupported, useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import OperationStatus from 'app/templates/OperationStatus';
import { StakeAmountField, FormData, convertFiatToAssetAmount } from 'app/templates/StakeAmountInput';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';
import { useDelegate, useKnownBaker } from 'lib/temple/front';
import { useSafeState } from 'lib/ui/hooks';
import { getTezosToolkitWithSigner } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

interface Props {
  accountPkh: string;
  network: TezosNetworkEssentials;
  cannotDelegate: boolean;
}

export const NewStakeTab = memo<Props>(({ accountPkh, network, cannotDelegate }) => {
  const { rpcBaseURL, chainId } = network;

  const { value: balance } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const maxAmountInTezos = useMemo(() => {
    if (!balance) return null;

    return BigNumber.max(balance.minus(MINIMAL_FEE), 0);
  }, [balance]);

  const { data: myBakerPkh } = useDelegate(accountPkh, network, true, false);
  const { data: knownBaker } = useKnownBaker(myBakerPkh || null, chainId, false);
  const knownBakerName = knownBaker?.name;

  const [operation, setOperation] = useSafeState<WalletOperation | null>(null, `${accountPkh}@${chainId}`);
  const [submitting, setSubmitting] = useState(false);

  const { data: stakingIsNotSupported } = useIsStakingNotSupported(rpcBaseURL, myBakerPkh);
  const requestsSwr = useUnstakeRequests(rpcBaseURL, accountPkh, true);

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

  const assetPrice = useAssetFiatCurrencyPrice(TEZ_TOKEN_SLUG, chainId);

  const { decimals } = getTezosGasMetadata(chainId);

  const onSubmit = useCallback(
    ({ amount }: FormData) => {
      const tezosAmount = inFiat ? convertFiatToAssetAmount(amount, assetPrice, decimals) : amount;
      const inputAmount = Number(tezosAmount);

      const analyticsProps = {
        inputAmount,
        provider: knownBakerName
      };

      setSubmitting(true);

      const tezos = getTezosToolkitWithSigner(rpcBaseURL, accountPkh);

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
        )
        .finally(() => setSubmitting(false));
    },
    [
      setOperation,
      reset,
      trackSubmitSuccess,
      trackSubmitFail,
      inFiat,
      assetPrice,
      rpcBaseURL,
      accountPkh,
      knownBakerName,
      decimals
    ]
  );

  const alertElement = useMemo(() => {
    if (stakingIsNotSupported)
      return (
        <Alert
          type="warning"
          title="Unable to stake"
          description="Your current baker doesn’t support TEZ staking. To unlock staking feature, re-delegate your account to another baker."
        />
      );

    if (pendingRequestsForAnotherBaker)
      return (
        <Alert
          type="warning"
          title="Pending unstake"
          description="You've got an unstake request ongoing. New stake will be available after unstake request is finalized."
        />
      );

    return null;
  }, [stakingIsNotSupported, pendingRequestsForAnotherBaker]);

  const disableInput = cannotDelegate || stakingIsNotSupported || pendingRequestsForAnotherBaker;
  const errorsInForm = Boolean(errors.amount);
  const disableSubmit = disableInput || errorsInForm;

  return (
    <div className="flex flex-col gap-y-8 pb-4">
      {operation && <OperationStatus typeTitle={t('stake')} network={network} operation={operation} />}

      {alertElement}

      <div className="flex flex-col gap-y-4">
        <span className="text-base font-medium text-blue-750">Current Baker</span>

        {myBakerPkh ? (
          <BakerBanner network={network} accountPkh={accountPkh} bakerPkh={myBakerPkh} />
        ) : (
          <div className={BAKER_BANNER_CLASSNAME}>---</div>
        )}
      </div>

      <form className="flex flex-col gap-y-4" onSubmit={handleSubmit(onSubmit)}>
        <StakeAmountField
          tezosChainId={chainId}
          inFiat={inFiat}
          maxAmountInTezos={maxAmountInTezos}
          assetPrice={assetPrice}
          accountPkh={accountPkh}
          setInFiat={setInFiat}
          disabled={disableInput}
          {...form}
        />

        <StakeButton type="submit" disabled={disableSubmit} loading={submitting} />
      </form>
    </div>
  );
});

/** Just to be able to apply 'Max Amount' & not fail estimation on confirm */
const MINIMAL_FEE = 1e-4;
