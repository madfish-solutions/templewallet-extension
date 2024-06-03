import React, { memo, useCallback, useMemo, useState } from 'react';

import { WalletOperation } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { Alert } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StakeButton } from 'app/atoms/BakingButtons';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { useUnstakeRequests } from 'app/hooks/use-baking-hooks';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import { BakerBanner, BAKER_BANNER_CLASSNAME } from 'app/templates/BakerBanner';
import OperationStatus from 'app/templates/OperationStatus';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance } from 'lib/balances';
import { useFiatCurrency, useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { t, toLocalFixed } from 'lib/i18n';
import { TEZOS_METADATA, useGasTokenMetadata } from 'lib/metadata';
import { useAccount, useDelegate, useKnownBaker, useNetwork, useTezos } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useDidUpdate, useSafeState } from 'lib/ui/hooks';

export const NewStakeTab = memo(() => {
  const acc = useAccount();
  const cannotDelegate = acc.type === TempleAccountType.WatchOnly;

  const tezos = useTezos();
  const network = useNetwork();

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

  const { handleSubmit, errors, control, setValue, reset, triggerValidation, getValues, watch } = useForm<FormData>({
    mode: 'onChange'
  });

  const { trackSubmitSuccess, trackSubmitFail } = useFormAnalytics('STAKE_FOR_BAKER_FORM');

  const [inFiat, setInFiat] = useState(false);

  const {
    selectedFiatCurrency: { symbol: fiatSymbol, name: fiatName }
  } = useFiatCurrency();
  const assetPrice = useAssetFiatCurrencyPrice(TEZ_TOKEN_SLUG);
  const canEnterInFiat = network.type === 'main' && assetPrice.gt(0);

  useDidUpdate(() => {
    if (!canEnterInFiat) setInFiat(false);
  }, [canEnterInFiat]);

  const { symbol, decimals } = useGasTokenMetadata();

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value) =>
      new BigNumber(fiatAmount).dividedBy(assetPrice).toFormat(decimals, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, decimals]
  );

  const { value: balance } = useBalance(TEZ_TOKEN_SLUG, acc.publicKeyHash);

  const maxAmount = useMemo(() => {
    if (!balance) return null;

    const maxAmountInTezos = BigNumber.max(balance.minus(MINIMAL_FEE), 0);
    if (!inFiat) return maxAmountInTezos;

    return maxAmountInTezos.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR);
  }, [balance, inFiat, assetPrice]);

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
      const analyticsProps = {
        inputAsset: inFiat ? fiatName : symbol,
        inputAmount: amount,
        provider: knownBakerName
      };

      const tezosAmount = inFiat ? toAssetAmount(amount) : amount;

      tezos.wallet
        .stake({ amount: Number(tezosAmount) })
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
    [
      tezos,
      setOperation,
      reset,
      trackSubmitSuccess,
      trackSubmitFail,
      toAssetAmount,
      inFiat,
      symbol,
      fiatName,
      knownBakerName
    ]
  );

  const amountValue = watch('amount');

  const labelDescription = useMemo(() => {
    if (!maxAmount) return null;

    const maxAmountFormatted = toLocalFixed(maxAmount);

    return (
      <div className="flex flex-col gap-y-1">
        <div>
          <span>Available (max): </span>

          <button type="button" className="underline" onClick={handleSetMaxAmount}>
            {inFiat ? `${fiatSymbol}${maxAmountFormatted}` : `${maxAmountFormatted} ${symbol}`}
          </button>
        </div>

        {amountValue ? (
          <ConvertedInputAssetAmount
            assetSlug={TEZ_TOKEN_SLUG}
            assetMetadata={TEZOS_METADATA}
            amountValue={inFiat ? toAssetAmount(amountValue) : amountValue}
            toFiat={!inFiat}
          />
        ) : null}
      </div>
    );
  }, [inFiat, maxAmount, handleSetMaxAmount, toAssetAmount, symbol, fiatSymbol, amountValue]);

  const assetFieldSymbolNode = useMemo(() => {
    if (!canEnterInFiat) return symbol;

    const handleFiatToggle: React.MouseEventHandler<HTMLButtonElement> = event => {
      event.preventDefault();

      const newInFiat = !inFiat;
      setInFiat(newInFiat);
      const amountStr = getValues().amount;
      if (!amountStr) return;

      const amount = new BigNumber(amountStr);
      setValue(
        'amount',
        (newInFiat ? amount.multipliedBy(assetPrice) : amount.div(assetPrice)).toFormat(
          newInFiat ? 2 : decimals,
          BigNumber.ROUND_FLOOR,
          { decimalSeparator: '.' }
        )
      );
    };

    return (
      <button
        onClick={handleFiatToggle}
        className={clsx(
          'px-1 rounded-md flex items-center gap-x-1 font-light',
          'hover:bg-black hover:bg-opacity-5',
          'trasition ease-in-out duration-200',
          'pointer-events-auto'
        )}
      >
        {inFiat ? fiatSymbol : symbol}

        <div className="h-4 flex flex-col justify-between">
          <ChevronUpIcon className="h-2 w-auto stroke-current stroke-2" />
          <ChevronDownIcon className="h-2 w-auto stroke-current stroke-2" />
        </div>
      </button>
    );
  }, [canEnterInFiat, inFiat, symbol, fiatSymbol, decimals, assetPrice, getValues, setValue]);

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
          assetSymbol={assetFieldSymbolNode}
          assetDecimals={inFiat ? 2 : decimals}
          label={`Stake ${symbol}`}
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
