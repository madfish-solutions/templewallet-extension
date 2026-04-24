import React, { FC, useCallback } from 'react';

import { useFormContext, useWatch } from 'react-hook-form';

import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';

import { useAllFiatCurrencies } from '../hooks/use-all-fiat-currencies';
import { BuyWithCreditCardFormData, DefaultModalProps } from '../types';

import { SelectAssetBase } from './SelectAssetBase';

interface Props extends DefaultModalProps {
  onCurrencySelect?: SyncFn<TopUpInputInterface>;
}

export const SelectCurrencyModal: FC<Props> = ({ onCurrencySelect, onRequestClose, ...rest }) => {
  const { control, setValue } = useFormContext<BuyWithCreditCardFormData>();

  const inputCurrency = useWatch({ control, name: 'inputCurrency' });
  const outputToken = useWatch({ control, name: 'outputToken' });

  const allFiatCurrencies = useAllFiatCurrencies(inputCurrency.code, outputToken.slug);

  const currenciesLoading = useCurrenciesLoadingSelector();

  const handleCurrencySelect = useCallback(
    (currency: TopUpInputInterface) => {
      setValue('inputCurrency', currency);
      onCurrencySelect?.(currency);
      onRequestClose?.();
    },
    [setValue, onCurrencySelect, onRequestClose]
  );

  return (
    <SelectAssetBase<TopUpInputInterface>
      assets={allFiatCurrencies}
      loading={currenciesLoading}
      onCurrencySelect={handleCurrencySelect}
      onRequestClose={onRequestClose}
      {...rest}
    />
  );
};
