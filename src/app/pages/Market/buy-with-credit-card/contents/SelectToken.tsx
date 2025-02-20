import React, { FC, useCallback, useLayoutEffect, useMemo, useState } from 'react';

import { useFormContext } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { BackButton } from 'app/atoms/PageModal';
import { useCurrenciesLoadingSelector } from 'app/store/buy-with-credit-card/selectors';
import { SearchBarField } from 'app/templates/SearchField';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { isSearchStringApplicable, searchAndFilterItems } from 'lib/utils/search-items';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useTezosMainnetChain
} from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ModalHeaderConfig } from '../../types';
import { AssetIcon } from '../components/AssetIcon';
import { BuyWithCreditCardFormData } from '../form-data.interface';
import { useAllCryptoCurrencies } from '../hooks/use-all-crypto-currencies';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onTokenSelect?: SyncFn<TopUpOutputInterface>;
  onGoBack?: EmptyFn;
}

export const SelectToken: FC<Props> = ({ setModalHeaderConfig, onTokenSelect, onGoBack }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const { setValue } = useFormContext<BuyWithCreditCardFormData>();

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
        const [chainKind, chainId] = parseChainAssetSlug(token.chainAssetSlug);

        const isTezosNetwork = Boolean(tezosAddress) && chainKind === TempleChainKind.Tezos;
        const isEnabledEvmNetwork = Boolean(evmAddress) && evmChains.some(chain => chain.chainId === chainId);

        return isTezosNetwork || isEnabledEvmNetwork;
      }),
    [allTokens, evmAddress, evmChains, tezosAddress]
  );

  const searchedTokens = useMemo(
    () => (inSearch ? searchAndFilterTokens(enabledTokens, searchValueDebounced) : enabledTokens),
    [enabledTokens, inSearch, searchValueDebounced]
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
    <>
      <div className="p-4">
        <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} className="p-4" />
      </div>

      <div className="px-4 pb-1 flex-grow flex flex-col overflow-y-auto">
        {currenciesLoading ? (
          <PageLoader stretch />
        ) : searchedTokens.length === 0 ? (
          <EmptyState stretch />
        ) : (
          <>
            {searchedTokens.map(token => (
              <Token key={token.code} token={token} onClick={handleTokenSelect} />
            ))}
          </>
        )}
      </div>
    </>
  );
};

interface TokenProps {
  token: TopUpOutputInterface;
  onClick?: (currency: TopUpOutputInterface) => void;
}

const Token: FC<TokenProps> = ({ token, onClick }) => {
  const [chainKind, chainId] = useMemo(() => parseChainAssetSlug(token.chainAssetSlug), [token.chainAssetSlug]);

  const isTez = chainKind === TempleChainKind.Tezos;

  const tezosMainnet = useTezosMainnetChain();
  const evmChain = useEvmChainByChainId(Number(chainId));

  const networkName = isTez ? tezosMainnet.name : evmChain?.name ?? 'Unknown';

  const handleClick = useCallback(() => onClick?.(token), [token, onClick]);

  return (
    <div
      className="w-full flex justify-start items-center cursor-pointer p-2 rounded-8 hover:bg-secondary-low"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2 min-h-10">
        <AssetIcon src={token.icon} code={token.code} />

        <div className="flex flex-col">
          <span className="text-font-medium">{getAssetSymbolToDisplay(token)}</span>

          <span className="text-font-description text-grey-1 w-40 truncate">{token.name}</span>
        </div>
      </div>

      <p className="text-end text-font-num-12 text-grey-1 w-40 truncate">{networkName}</p>
    </div>
  );
};

const searchAndFilterTokens = (currencies: TopUpOutputInterface[], searchValue: string) =>
  searchAndFilterItems(currencies, searchValue.trim(), [
    { name: 'name', weight: 1 },
    { name: 'code', weight: 1 }
  ]);
