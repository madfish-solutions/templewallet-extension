import React, { memo, useMemo } from 'react';

import { isFilterChain } from 'app/pages/Swap/form/utils';
import { t } from 'lib/i18n';
import Popper from 'lib/ui/Popper';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ALL_NETWORKS, FAVORITES } from './constants';
import { NetworkDropdown } from './dropdown';
import { NetworkPopperProps } from './types';

export const NetworkPopper = memo<NetworkPopperProps>(
  ({
    selectedOption,
    showAllNetworksOption,
    showOnlyEvmNetworks,
    showFavoritesOption,
    chainKind,
    placement = 'bottom-end',
    onOptionSelect,
    supportedChainIds,
    availableChainIds,
    children
  }) => {
    const allTezosChains = useAllTezosChains();
    const allEvmChains = useAllEvmChains();

    const selectedOptionName = useMemo(() => {
      if (!selectedOption) return t(ALL_NETWORKS);
      if (typeof selectedOption === 'string' && selectedOption === FAVORITES) return t(FAVORITES);

      if (isFilterChain(selectedOption) && selectedOption.kind === TempleChainKind.Tezos) {
        return allTezosChains[selectedOption.chainId]?.name;
      }

      return isFilterChain(selectedOption) ? allEvmChains[selectedOption.chainId]?.name : '';
    }, [allEvmChains, allTezosChains, selectedOption]);

    return (
      <Popper
        placement={placement}
        strategy="fixed"
        popup={popperProps => (
          <NetworkDropdown
            supportedChainIds={supportedChainIds}
            availableChainIds={availableChainIds}
            showAllNetworksOption={showAllNetworksOption}
            showOnlyEvmNetworks={showOnlyEvmNetworks}
            showFavoritesOption={showFavoritesOption}
            selectedOption={selectedOption}
            onOptionSelect={onOptionSelect}
            chainKind={chainKind}
            {...popperProps}
          />
        )}
      >
        {props => children({ ...props, selectedOptionName })}
      </Popper>
    );
  }
);
