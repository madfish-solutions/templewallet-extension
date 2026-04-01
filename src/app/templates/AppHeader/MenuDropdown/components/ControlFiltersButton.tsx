import { memo, useMemo } from 'react';

import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { useAssetsFilterOptionsSelector, useHasActiveFiltersSelector } from 'app/store/assets-filter-options/selectors';
import { TempleChainKind } from 'temple/types';

import { ControlButton } from './ControlButton';

interface Props {
  expanded: boolean;
  onClick: EmptyFn;
  stretch?: boolean;
  testID?: string;
}

export const ControlFiltersButton = memo<Props>(({ expanded, onClick, stretch, testID }) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const hasActiveFilters = useHasActiveFiltersSelector();

  const iconNode = useMemo(() => {
    if (filterChain) {
      return filterChain.kind === TempleChainKind.Tezos ? (
        <TezosNetworkLogo chainId={filterChain.chainId} size={20} bordered={false} />
      ) : (
        <EvmNetworkLogo chainId={filterChain.chainId} size={20} bordered={false} />
      );
    }

    return;
  }, [filterChain]);

  return (
    <ControlButton
      labelI18n="filters"
      expanded={expanded}
      stretch={stretch}
      Icon={hasActiveFilters ? FilterOnIcon : FilterOffIcon}
      iconNode={iconNode}
      active={hasActiveFilters}
      onClick={onClick}
      testID={testID}
    />
  );
});
