import React, { FC, memo, useCallback } from 'react';

import { Button } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { CrossChainAsset, ExolixNetworksOverride, getAllowedToAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';

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
  const assets = getAllowedToAssets(currentFromAsset, networksMap);

  const handleSelect = useCallback(
    (asset: CrossChainAsset) => {
      onSelect(asset);
      onRequestClose();
    },
    [onRequestClose, onSelect]
  );

  return (
    <PageModal opened={opened} title={t('selectGetToken')} onRequestClose={onRequestClose}>
      <div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col">
        {assets.length === 0 ? (
          <div className="text-center text-grey-1 py-6">
            <T id="noTokensAvailable" />
          </div>
        ) : (
          assets.map(asset => <Item key={toCrossChainAssetSlug(asset)} asset={asset} onClick={handleSelect} />)
        )}
      </div>
    </PageModal>
  );
};

interface ItemProps {
  asset: CrossChainAsset;
  onClick: SyncFn<CrossChainAsset>;
}

const Item = memo<ItemProps>(({ asset, onClick }) => {
  const handleClick = useCallback(() => onClick(asset), [asset, onClick]);

  return (
    <Button
      className="w-full cursor-pointer flex justify-between items-center p-2 rounded-8 hover:bg-secondary-low"
      onClick={handleClick}
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
});
