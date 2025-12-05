import React, { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDebounce } from 'use-debounce';

import { EmptyState } from 'app/atoms/EmptyState';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { SearchBarField } from 'app/templates/SearchField';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { isSearchStringApplicable, searchAndFilterItems } from 'lib/utils/search-items';
import { useAllEvmChains, useTezosMainnetChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AssetIcon } from '../components/AssetIcon';
import { DefaultModalProps } from '../types';

type Asset = TopUpInputInterface | TopUpOutputInterface;

interface Props<T extends Asset> extends DefaultModalProps {
  assets: T[];
  loading?: boolean;
  onCurrencySelect?: SyncFn<T>;
}

export const SelectAssetBase = <T extends Asset>({ assets, loading, onCurrencySelect, ...modalProps }: Props<T>) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const searchedAssets = useMemo(
    () => (inSearch ? searchAndFilterAssets(assets, searchValueDebounced) : assets),
    [assets, inSearch, searchValueDebounced]
  );

  return (
    <PageModal {...modalProps}>
      <div className="p-4">
        <SearchBarField value={searchValue} defaultRightMargin={false} onValueChange={setSearchValue} className="p-4" />
      </div>

      <div className="px-4 pb-1 flex-grow flex flex-col overflow-y-auto">
        {loading ? (
          <PageLoader stretch />
        ) : searchedAssets.length === 0 ? (
          <EmptyState stretch />
        ) : (
          <>
            {searchedAssets.map(asset => (
              <Asset key={asset.code} asset={asset} onClick={onCurrencySelect} />
            ))}
          </>
        )}
      </div>
    </PageModal>
  );
};

interface AssetProps<T extends Asset> {
  asset: T;
  onClick?: SyncFn<T>;
}

const Asset = <T extends Asset>({ asset, onClick }: AssetProps<T>) => {
  const tezosMainnet = useTezosMainnetChain();
  const allEvmChains = useAllEvmChains();

  const networkName = useMemo(() => {
    if (isFiat(asset)) return;

    const [_, chainKind, chainId] = fromTopUpTokenSlug(asset.slug);

    if (chainKind === TempleChainKind.Tezos) return tezosMainnet.name;

    const evmChain = allEvmChains[Number(chainId)];

    return evmChain?.name;
  }, [tezosMainnet, allEvmChains, asset]);

  const handleClick = useCallback(() => onClick?.(asset), [asset, onClick]);

  return (
    <div
      className="w-full flex justify-start items-center cursor-pointer p-2 rounded-8 hover:bg-secondary-low"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2 min-h-10">
        <AssetIcon useFlagIcon={isFiat(asset)} src={asset.icon} code={asset.code} />

        <div className="flex flex-col">
          <span className="text-font-medium">{getAssetSymbolToDisplay(asset)}</span>

          <span className="text-font-description text-grey-1 w-40 truncate">{asset.name}</span>
        </div>
      </div>

      {networkName && <p className="text-end text-font-num-12 text-grey-1 w-40 truncate">{networkName}</p>}
    </div>
  );
};

const isFiat = (asset: Asset): asset is TopUpInputInterface => !isDefined((asset as TopUpOutputInterface).slug);

const searchAndFilterAssets = <T extends Asset>(assets: T[], searchValue: string) =>
  searchAndFilterItems(assets, searchValue.trim(), [
    { name: 'name', weight: 1 },
    { name: 'code', weight: 1 }
  ]);
