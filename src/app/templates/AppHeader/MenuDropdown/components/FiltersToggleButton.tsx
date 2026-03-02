import { memo, useMemo } from 'react';

import { isEqual } from 'lodash';

import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { TempleChainKind } from 'temple/types';

import { ToggleButton } from './ToggleButton';

interface Props {
  expanded: boolean;
  onClick: EmptyFn;
  testID?: string;
}

export const FiltersToggleButton = memo<Props>(({ expanded, onClick, testID }) => {
  const assetsFilterOptions = useAssetsFilterOptionsSelector();
  const selectedNetwork = assetsFilterOptions.filterChain;

  const hasCustomNonNetworkOptions = useMemo(
    () =>
      !isEqual(
        {
          ...assetsFilterOptions,
          filterChain: null
        },
        AssetsFilterOptionsInitialState
      ),
    [assetsFilterOptions]
  );

  const isActive = Boolean(selectedNetwork) || hasCustomNonNetworkOptions;

  const iconNode = useMemo(() => {
    if (selectedNetwork) {
      return selectedNetwork.kind === TempleChainKind.Tezos ? (
        <TezosNetworkLogo chainId={selectedNetwork.chainId} size={20} />
      ) : (
        <EvmNetworkLogo chainId={selectedNetwork.chainId} size={20} imgClassName="border-0 bg-transparent p-0" />
      );
    }

    return hasCustomNonNetworkOptions ? (
      <FilterOnIcon className="w-full h-full" />
    ) : (
      <FilterOffIcon className="w-full h-full" />
    );
  }, [hasCustomNonNetworkOptions, selectedNetwork]);

  return (
    <ToggleButton
      iconNode={iconNode}
      labelI18n="filters"
      expanded={expanded}
      highlighted={isActive}
      onClick={onClick}
      testID={testID}
    />
  );
});
