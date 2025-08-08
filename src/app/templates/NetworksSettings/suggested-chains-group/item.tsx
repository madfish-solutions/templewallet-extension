import React, { memo } from 'react';

import { Chain as ViemChain } from 'viem';

import { IconBase } from 'app/atoms';
import { EvmNetworkLogo } from 'app/atoms/NetworkLogo';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';

interface SuggestedChainsGroupItemProps {
  item: ViemChain;
  isLast: boolean;
  onChainSelect: SyncFn<ViemChain>;
  searchValue?: string;
}

export const SuggestedChainsGroupItem = memo<SuggestedChainsGroupItemProps>(
  ({ item, isLast, onChainSelect, searchValue }) => (
    <SettingsCellSingle
      isLast={isLast}
      cellIcon={<EvmNetworkLogo chainId={item.id} chainName={item.name} size={24} />}
      cellName={
        <span className="text-font-medium-bold flex-1">
          {searchValue ? <SearchHighlightText searchValue={searchValue}>{item.name}</SearchHighlightText> : item.name}
        </span>
      }
      wrapCellName={false}
      Component="div"
      onClick={() => onChainSelect(item)}
      className="cursor-pointer"
    >
      <IconBase size={16} className="text-primary" Icon={PlusIcon} />
    </SettingsCellSingle>
  )
);
