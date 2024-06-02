import React, { memo, useCallback, useMemo } from 'react';

import { WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StakeButton } from 'app/atoms/BakingButtons';
import { useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import OperationStatus from 'app/templates/OperationStatus';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { t, toLocalFixed } from 'lib/i18n';
import { TEZOS_METADATA } from 'lib/metadata';
import { useAccount, useDelegate, useTezos } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';

export const NewStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();

  const { data: myBakerPkh } = useDelegate(acc.publicKeyHash, true, false);

  const { value: balance } = useBalance(TEZ_TOKEN_SLUG, acc.publicKeyHash);

  const maxAmount = useMemo(() => (balance ? BigNumber.max(balance.minus(MINIMAL_FEE), 0) : null), [balance]);

  const [operation, setOperation] = useSafeState<WalletOperation | null>(null, tezos.checksum);

  const requestsSwr = useUnstakeRequests(tezos.rpc.getRpcUrl(), acc.publicKeyHash, true);

  const pendingRequestsForAnotherBaker = useMemo(() => {
    if (!myBakerPkh || !requestsSwr.data) return false;
    const { finalizable, unfinalizable } = requestsSwr.data;

    if (unfinalizable.delegate && unfinalizable.delegate !== myBakerPkh) return true;

    return finalizable.length ? finalizable.some(r => r.delegate !== myBakerPkh) : false;
  }, [requestsSwr.data, myBakerPkh]);

  const { handleSubmit, errors, control, setValue, reset, triggerValidation } = useForm<FormData>({
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
        .stake({
          amount: Number(amount)
        })
        .send()
        .then(
          operation => {
            setOperation(operation);
            reset();
          },
          error => {
            console.error(error);
          }
        );
    },
    [tezos, setOperation, reset]
  );

  const labelDescription = useMemo(() => {
    if (!maxAmount) return null;

    return (
      <>
        <span>Available (max) : </span>

        <button type="button" className="underline" onClick={handleSetMaxAmount}>
          {`${toLocalFixed(maxAmount)} ${TEZOS_METADATA.symbol}`}
        </button>
      </>
    );
  }, [maxAmount, handleSetMaxAmount]);

  const errorsInForm = Boolean(errors.amount);
  console.log('D:', myBakerPkh, requestsSwr.data?.unfinalizable.delegate);
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
        <Controller
          as={AssetField}
          name="amount"
          control={control}
          rules={amountRules}
          assetSymbol={TEZOS_METADATA.symbol}
          assetDecimals={TEZOS_METADATA.decimals}
          label={`Stake ${TEZOS_METADATA.symbol}`}
          labelDescription={labelDescription}
          placeholder={t('amountPlaceholder')}
          errorCaption={errors.amount?.message}
          autoFocus
        />

        <StakeButton type="submit" disabled={disableSubmit} />
      </form>
    </div>
  );
});

interface FormData {
  amount: string;
}

/** Just to be able to apply 'Max Amount' & not fail estimation on confirm */
const MINIMAL_FEE = 1e-4;
