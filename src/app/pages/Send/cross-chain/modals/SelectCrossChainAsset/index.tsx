import React, { FC, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { Button } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { PageModal } from 'app/atoms/PageModal';
import { SearchBarField } from 'app/templates/SearchField';
import { CrossChainAsset, ExolixNetworksOverride, getAllowedToAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { t } from 'lib/i18n';
import { isSearchStringApplicable, searchAndFilterByNameCodeNetwork } from 'lib/utils/search-items';

import { CrossChainAssetIcon } from '../../components/CrossChainAssetIcon';

interface Props {
  opened: boolean;
  currentFromAsset: CrossChainAsset;
  networksMap?: ExolixNetworksOverride;
  onSelect: SyncFn<CrossChainAsset>;
  onRequestClose: EmptyFn;
}

export const SelectCrossChainToAssetModal: FC<Props> = ({
  opened,
  currentFromAsset,
  networksMap,
  onSelect,
  onRequestClose
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const [prevOpened, setPrevOpened] = useState(opened);
  if (prevOpened !== opened) {
    setPrevOpened(opened);
    if (!opened) setSearchValue('');
  }

  const assets = getAllowedToAssets(currentFromAsset, networksMap);

  const displayAssets = isSearchStringApplicable(searchValueDebounced)
    ? searchAndFilterByNameCodeNetwork(
        assets,
        searchValueDebounced,
        ({ name, symbol, exolixCoin, exolixNetwork, dest }) => ({
          name,
          code: `${symbol} ${exolixCoin}`,
          networkName: dest === 'btc' ? 'Bitcoin' : exolixNetwork
        })
      )
    : assets;

  const handleSelect = (asset: CrossChainAsset) => {
    onSelect(asset);
    onRequestClose();
  };

  return (
    <PageModal opened={opened} title={t('selectGetToken')} onRequestClose={onRequestClose}>
      <div className="flex flex-col px-4 pt-4 pb-3">
        <SearchBarField
          value={searchValue}
          placeholder={t('tokenNamePlaceholder')}
          defaultRightMargin={false}
          onValueChange={setSearchValue}
        />
      </div>

      <div className="flex-1 px-4 pb-4 overflow-y-auto flex flex-col">
        {displayAssets.length === 0 ? (
          <EmptyState />
        ) : (
          displayAssets.map(asset => <Item key={toCrossChainAssetSlug(asset)} asset={asset} onClick={handleSelect} />)
        )}
      </div>
    </PageModal>
  );
};

interface ItemProps {
  asset: CrossChainAsset;
  onClick: SyncFn<CrossChainAsset>;
}

const Item: FC<ItemProps> = ({ asset, onClick }) => (
  <Button
    className="w-full cursor-pointer flex justify-between items-center p-2 rounded-8 hover:bg-secondary-low"
    onClick={() => onClick(asset)}
  >
    <div className="flex items-center gap-x-2">
      <CrossChainAssetIcon asset={asset} size={32} />
      <div className="text-start">
        <p className="text-font-medium">{asset.symbol}</p>
        <p className="text-font-description text-grey-1 max-w-40 truncate">{asset.name}</p>
      </div>
    </div>
    <p className="text-end text-font-num-12 text-grey-1">{asset.dest === 'btc' ? 'Bitcoin' : asset.exolixNetwork}</p>
  </Button>
);
