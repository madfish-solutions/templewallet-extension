import React, { FC, useCallback, useLayoutEffect, useMemo } from 'react';

import { intersection } from 'lodash';
import { useFormContext } from 'react-hook-form-v7';

import { BackButton } from 'app/atoms/PageModal';
import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { useAccountAddressForEvm, useAccountAddressForTezos, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ModalHeaderConfig } from '../../types';
import { BuyWithCreditCardFormData } from '../form-data.interface';
import { useAllCryptoCurrencies } from '../hooks/use-all-crypto-currencies';

import { SelectAssetBase } from './SelectAssetBase';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onTokenSelect?: SyncFn<TopUpOutputInterface>;
  onGoBack?: EmptyFn;
}

export const SelectToken: FC<Props> = ({ setModalHeaderConfig, onTokenSelect, onGoBack }) => {
  const { watch, setValue } = useFormContext<BuyWithCreditCardFormData>();

  const inputCurrency = watch('inputCurrency');

  const evmChains = useEnabledEvmChains();

  const evmAddress = useAccountAddressForEvm();
  const tezosAddress = useAccountAddressForTezos();

  const allTokens = useAllCryptoCurrencies();
  const currenciesLoading = useCurrenciesLoadingSelector();

  useLayoutEffect(
    () => void setModalHeaderConfig({ title: t('selectToken'), titleLeft: <BackButton onClick={onGoBack} /> }),
    [onGoBack, setModalHeaderConfig]
  );

  const enabledTokens = useMemo(
    () =>
      allTokens.filter(token => {
        const [_, chainKind, chainId] = fromTopUpTokenSlug(token.slug);

        const isTezosNetwork = Boolean(tezosAddress) && chainKind === TempleChainKind.Tezos;
        const isEnabledEvmNetwork = Boolean(evmAddress) && evmChains.some(chain => chain.chainId === Number(chainId));

        return isTezosNetwork || isEnabledEvmNetwork;
      }),
    [allTokens, evmAddress, evmChains, tezosAddress]
  );

  const tokensForSelectedFiat = useMemo(
    () => enabledTokens.filter(token => intersection(inputCurrency.providers, token.providers).length > 0),
    [enabledTokens, inputCurrency]
  );

  const handleTokenSelect = useCallback(
    (token: TopUpOutputInterface) => {
      setValue('outputToken', token);
      onTokenSelect?.(token);
      onGoBack?.();
    },
    [setValue, onTokenSelect, onGoBack]
  );

  return (
    <SelectAssetBase<TopUpOutputInterface>
      assets={tokensForSelectedFiat}
      loading={currenciesLoading}
      onCurrencySelect={handleTokenSelect}
    />
  );
};
