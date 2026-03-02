import { memo, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';

import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { TempleChainKind } from 'temple/types';

import { ControlButton } from './ControlButton';

interface Props {
  expanded: boolean;
  onClick: EmptyFn;
  testID?: string;
}

export const ControlFiltersButton = memo<Props>(({ expanded, onClick, testID }) => {
  const assetsFilterOptions = useAssetsFilterOptionsSelector();
  const selectedNetwork = assetsFilterOptions.filterChain;

  const options = useAssetsFilterOptionsSelector();

  const isNonDefaultOption = useMemo(() => !isEqual(options, AssetsFilterOptionsInitialState), [options]);

  const isActive = isDefined(selectedNetwork) || isNonDefaultOption;

  const iconNode = useMemo(() => {
    if (selectedNetwork) {
      return selectedNetwork.kind === TempleChainKind.Tezos ? (
        <TezosNetworkLogo chainId={selectedNetwork.chainId} size={20} />
      ) : (
        <EvmNetworkLogo chainId={selectedNetwork.chainId} size={20} imgClassName="border-0 bg-transparent p-0" />
      );
    }

    return isNonDefaultOption ? <FilterOnIcon className="text-secondary" /> : <FilterOffIcon />;
  }, [isNonDefaultOption, selectedNetwork]);

  return (
    <ControlButton
      labelI18n="filters"
      expanded={expanded}
      iconNode={iconNode}
      active={isActive}
      onClick={onClick}
      testID={testID}
    />
  );
});
