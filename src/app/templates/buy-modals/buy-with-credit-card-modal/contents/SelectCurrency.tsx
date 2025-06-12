import React, { FC, useCallback, useLayoutEffect } from 'react';

import { useFormContext } from 'react-hook-form-v7';

import { ModalHeaderConfig } from 'app/atoms/PageModal';
import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';

import { BuyWithCreditCardFormData } from '../form-data.interface';
import { useAllFiatCurrencies } from '../hooks/use-all-fiat-currencies';

import { SelectAssetBase } from './SelectAssetBase';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onCurrencySelect?: SyncFn<TopUpInputInterface>;
  onGoBack?: EmptyFn;
}

export const SelectCurrency: FC<Props> = ({ setModalHeaderConfig, onCurrencySelect, onGoBack }) => {
  const { watch, setValue } = useFormContext<BuyWithCreditCardFormData>();

  const inputCurrency = watch('inputCurrency');
  const outputToken = watch('outputToken');

  useLayoutEffect(
    () => void setModalHeaderConfig({ title: t('selectCurrency'), onGoBack }),
    [onGoBack, setModalHeaderConfig]
  );

  const allFiatCurrencies = useAllFiatCurrencies(inputCurrency.code, outputToken.slug);

  const currenciesLoading = useCurrenciesLoadingSelector();

  const handleCurrencySelect = useCallback(
    (currency: TopUpInputInterface) => {
      setValue('inputCurrency', currency);
      onCurrencySelect?.(currency);
      onGoBack?.();
    },
    [setValue, onCurrencySelect, onGoBack]
  );

  return (
    <SelectAssetBase<TopUpInputInterface>
      assets={allFiatCurrencies}
      loading={currenciesLoading}
      onCurrencySelect={handleCurrencySelect}
    />
  );
};
