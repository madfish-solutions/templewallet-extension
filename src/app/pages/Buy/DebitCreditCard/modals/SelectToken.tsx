import React, { FC, useCallback, useMemo } from 'react';

import { intersection } from 'lodash';
import { useFormContext } from 'react-hook-form-v7';

import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { useAccountAddressForEvm, useAccountAddressForTezos, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useAllCryptoCurrencies } from '../hooks/use-all-crypto-currencies';
import { BuyWithCreditCardFormData, DefaultModalProps } from '../types';

import { SelectAssetBase } from './SelectAssetBase';

interface Props extends DefaultModalProps {
  onTokenSelect?: SyncFn<TopUpOutputInterface>;
}

export const SelectTokenModal: FC<Props> = ({ onTokenSelect, onRequestClose, ...rest }) => {
  const { watch, setValue } = useFormContext<BuyWithCreditCardFormData>();

  const inputCurrency = watch('inputCurrency');

  const evmChains = useEnabledEvmChains();

  const evmAddress = useAccountAddressForEvm();
  const tezosAddress = useAccountAddressForTezos();

  const allTokens = useAllCryptoCurrencies();
  const currenciesLoading = useCurrenciesLoadingSelector();

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
      onRequestClose?.();
    },
    [setValue, onTokenSelect, onRequestClose]
  );

  return (
    <SelectAssetBase<TopUpOutputInterface>
      assets={tokensForSelectedFiat}
      loading={currenciesLoading}
      onCurrencySelect={handleTokenSelect}
      onRequestClose={onRequestClose}
      {...rest}
    />
  );
};
