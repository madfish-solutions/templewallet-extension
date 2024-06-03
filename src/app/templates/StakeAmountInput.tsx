import React, { FC, useMemo, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { Controller, FormContextValues } from 'react-hook-form';

import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, toLocalFixed } from 'lib/i18n';
import { TEZOS_METADATA, useGasTokenMetadata } from 'lib/metadata';
import { useNetwork } from 'lib/temple/front';
import { useDidUpdate } from 'lib/ui/hooks';

export interface FormData {
  amount: string;
}

interface Props extends FormContextValues<FormData> {
  forUnstake?: boolean;
  inFiat: boolean;
  maxAmountInTezos: BigNumber | null;
  assetPrice: BigNumber;
  accountPkh: string;
  setInFiat: SyncFn<boolean>;
}

export const StakeAmountField: FC<Props> = ({
  forUnstake,
  inFiat,
  maxAmountInTezos,
  assetPrice,
  accountPkh,
  setInFiat,
  ...form
}) => {
  const network = useNetwork();
  const { symbol, decimals } = useGasTokenMetadata();

  const { errors, control, setValue, triggerValidation, getValues, watch } = form;

  const amountValue = watch('amount');

  const canEnterInFiat = network.type === 'main' && assetPrice.gt(0);

  useDidUpdate(() => {
    if (!canEnterInFiat) setInFiat(false);
  }, [canEnterInFiat, setInFiat]);

  const maxAmount = useMemo(() => {
    if (!maxAmountInTezos) return null;

    return inFiat ? maxAmountInTezos.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : maxAmountInTezos;
  }, [inFiat, maxAmountInTezos, assetPrice]);

  const {
    selectedFiatCurrency: { symbol: fiatSymbol }
  } = useFiatCurrency();

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
  }, [canEnterInFiat, inFiat, symbol, fiatSymbol, decimals, assetPrice, getValues, setValue, setInFiat]);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.toString());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const labelDescription = useMemo(() => {
    if (!maxAmount) return null;

    const maxAmountFormatted = toLocalFixed(maxAmount);

    return (
      <div className="flex flex-col gap-y-1">
        <div>
          <span>Available {forUnstake ? 'amount' : '(max)'}: </span>

          <button type="button" className="underline" onClick={handleSetMaxAmount}>
            {inFiat ? `${fiatSymbol}${maxAmountFormatted}` : `${maxAmountFormatted} ${symbol}`}
          </button>
        </div>

        {amountValue ? (
          <ConvertedInputAssetAmount
            assetSlug={TEZ_TOKEN_SLUG}
            assetMetadata={TEZOS_METADATA}
            amountValue={inFiat ? convertFiatToAssetAmount(amountValue, assetPrice, decimals) : amountValue}
            toFiat={!inFiat}
          />
        ) : null}
      </div>
    );
  }, [inFiat, maxAmount, handleSetMaxAmount, fiatSymbol, amountValue, assetPrice, symbol, decimals, forUnstake]);

  return (
    <Controller
      as={AssetField}
      name="amount"
      control={control}
      rules={amountRules}
      assetSymbol={assetFieldSymbolNode}
      assetDecimals={inFiat ? 2 : decimals}
      label={`${forUnstake ? 'Unstake' : 'Stake'} ${symbol}`}
      labelDescription={labelDescription}
      placeholder={t('amountPlaceholder')}
      errorCaption={errors.amount?.message}
      autoFocus
    />
  );
};

export const convertFiatToAssetAmount = (fiatAmount: BigNumber.Value, assetPrice: BigNumber, decimals: number) =>
  new BigNumber(fiatAmount).dividedBy(assetPrice).toFormat(decimals, BigNumber.ROUND_FLOOR, {
    decimalSeparator: '.'
  });
