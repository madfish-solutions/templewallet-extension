import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { CrossChainAsset } from 'lib/cross-chain';
import { t } from 'lib/i18n';

import { CrossChainAssetIcon } from './CrossChainAssetIcon';

interface Props {
  asset?: CrossChainAsset;
  onClick: EmptyFn;
  placeholder?: string;
}

export const AssetSelectButton = memo<Props>(({ asset, onClick, placeholder = t('selectTokenAction') }) => (
  <Button
    onClick={onClick}
    className="bg-white py-0.75 px-2 rounded-8 flex items-center justify-between -mr-2.5 cursor-pointer w-[120px]"
  >
    {asset ? (
      <div className="flex items-center">
        <CrossChainAssetIcon asset={asset} size={32} />
        <span className="text-font-description-bold max-w-9 truncate">{asset.symbol}</span>
      </div>
    ) : (
      <span className="text-font-description-bold text-grey-1">{placeholder}</span>
    )}
    <IconBase Icon={CompactDown} className="text-primary" />
  </Button>
));
