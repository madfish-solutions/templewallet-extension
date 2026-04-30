import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { useDebounce } from 'use-debounce';

import { Button, IconBase } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { NetworkPopper } from 'app/templates/network-popper';
import { SearchBarField } from 'app/templates/SearchField';
import { CryptoBalance, FiatBalance } from 'app/pages/Home/OtherComponents/Tokens/components/Balance';
import { isFilterChain } from 'app/pages/Swap/form/utils';
import { CrossChainAsset, ExolixNetworksOverride, getAllowedFromAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { t } from 'lib/i18n';
import { TempleChainKind } from 'temple/types';

import { CrossChainAssetIcon } from '../../components/CrossChainAssetIcon';
import { useCrossChainFromBalances } from '../../hooks/use-cross-chain-balance';

interface Props {
  opened: boolean;
  networksMap?: ExolixNetworksOverride;
  onSelect: SyncFn<CrossChainAsset>;
  onRequestClose: EmptyFn;
}

const SUPPORTED_EVM_CHAIN_IDS = Array.from(
  new Set(
    getAllowedFromAssets()
      .filter(a => a.chainKind === TempleChainKind.EVM && a.chainId != null)
      .map(a => Number(a.chainId))
  )
);

export const SelectCrossChainFromAssetModal: FC<Props> = ({ opened, networksMap, onSelect, onRequestClose }) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchDebounced] = useDebounce(searchValue, 200);
  const [filterChain, setFilterChain] = useState<FilterChain | string>(null);

  const balances = useCrossChainFromBalances();

  useEffect(() => {
    if (!opened) {
      setSearchValue('');
      setFilterChain(null);
    }
  }, [opened]);

  const assets = useMemo(() => getAllowedFromAssets(networksMap), [networksMap]);

  const filteredAssets = useMemo(() => {
    const search = searchDebounced.trim().toLowerCase();
    return assets.filter(asset => {
      const slug = toCrossChainAssetSlug(asset);
      const balance = balances[slug];
      if (!balance || balance.isLessThanOrEqualTo(0)) return false;

      if (isFilterChain(filterChain) && filterChain) {
        if (filterChain.kind !== asset.chainKind) return false;
        if (String(filterChain.chainId) !== String(asset.chainId)) return false;
      }

      if (!search) return true;
      return (
        asset.symbol.toLowerCase().includes(search) ||
        asset.name.toLowerCase().includes(search) ||
        asset.exolixNetwork.toLowerCase().includes(search)
      );
    });
  }, [assets, balances, filterChain, searchDebounced]);

  const handleSelect = useCallback(
    (asset: CrossChainAsset) => {
      onSelect(asset);
      onRequestClose();
    },
    [onRequestClose, onSelect]
  );

  return (
    <PageModal title={t('selectToken')} opened={opened} onRequestClose={onRequestClose}>
      <div className="flex flex-col px-4 pt-4 pb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-font-description-bold">{t('filterByNetwork')}</span>
          <FilterNetworkPopper selectedOption={filterChain} onOptionSelect={setFilterChain} />
        </div>

        <SearchBarField
          value={searchValue}
          placeholder={t('tokenNamePlaceholder')}
          defaultRightMargin={false}
          onValueChange={setSearchValue}
        />
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto flex flex-col">
        {filteredAssets.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAssets.map(asset => {
            const slug = toCrossChainAssetSlug(asset);
            return <AssetRow key={slug} asset={asset} balance={balances[slug] ?? new BigNumber(0)} onClick={handleSelect} />;
          })
        )}
      </div>
    </PageModal>
  );
};

interface FilterNetworkPopperProps {
  selectedOption: FilterChain | string;
  onOptionSelect: (filterChain: FilterChain | string) => void;
}

const FilterNetworkPopper = memo<FilterNetworkPopperProps>(({ selectedOption, onOptionSelect }) => (
  <NetworkPopper
    selectedOption={selectedOption}
    onOptionSelect={onOptionSelect}
    showAllNetworksOption
    supportedChainIds={SUPPORTED_EVM_CHAIN_IDS}
  >
    {({ ref, toggleOpened, selectedOptionName }) => (
      <Button
        ref={ref}
        className={clsx(
          'flex items-center py-0.5 px-1 text-font-description-bold rounded',
          'text-secondary hover:bg-secondary-low'
        )}
        onClick={toggleOpened}
      >
        <span>{selectedOptionName}</span>
        <IconBase Icon={CompactDown} size={12} />
      </Button>
    )}
  </NetworkPopper>
));

interface AssetRowProps {
  asset: CrossChainAsset;
  balance: BigNumber;
  onClick: SyncFn<CrossChainAsset>;
}

const AssetRow = memo<AssetRowProps>(({ asset, balance, onClick }) => {
  const handleClick = useCallback(() => onClick(asset), [asset, onClick]);

  const isEvm = asset.chainKind === TempleChainKind.EVM && asset.chainId != null;
  const isTezos = asset.chainKind === TempleChainKind.Tezos && asset.chainId != null;

  return (
    <Button
      className={clsx(
        'w-full flex items-center gap-x-1 p-2 rounded-lg',
        'transition ease-in-out duration-200 hover:bg-secondary-low'
      )}
      onClick={handleClick}
    >
      <CrossChainAssetIcon asset={asset} size={32} className="shrink-0" />

      <div className="grow flex flex-col gap-y-1 overflow-hidden">
        <div className="flex gap-x-4">
          <div className="grow text-font-medium truncate text-start">{asset.symbol}</div>
          <CryptoBalance value={balance} />
        </div>

        <div className="flex gap-x-4">
          <div className="self-center grow text-font-description text-grey-1 truncate text-start">
            {asset.name}
          </div>
          {isEvm || isTezos ? (
            <FiatBalance
              evm={isEvm}
              chainId={asset.chainId!}
              assetSlug={asset.assetSlug ?? ''}
              value={balance}
            />
          ) : null}
        </div>
      </div>
    </Button>
  );
});
