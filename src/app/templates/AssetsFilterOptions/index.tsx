import React, { memo, useCallback, useMemo } from 'react';

import { isEqual } from 'lodash';

import { Divider, IconBase, ToggleSwitch } from 'app/atoms';
import { EvmNetworkLogo } from 'app/atoms/EvmNetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { dispatch } from 'app/store';
import {
  resetTokensFilterOptions,
  setTokensGroupByNetworkFilterOption,
  setTokensHideZeroBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useTokensFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { DefaultTokensFilterOptions, FilterChain } from 'app/store/assets-filter-options/state';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { NetworksModal } from './NetworksModal';

export const AssetsFilterOptions = memo(() => {
  const options = useTokensFilterOptionsSelector();

  const { filterChain, hideZeroBalance, groupByNetwork } = options;

  const [networksModalOpened, setNetworksModalOpen, setNetworksModalClosed] = useBooleanState(false);

  const handleHideZeroBalanceChange = useCallback(
    (checked: boolean) => dispatch(setTokensHideZeroBalanceFilterOption(checked)),
    []
  );
  const handleGroupByNetworkChange = useCallback(
    (checked: boolean) => dispatch(setTokensGroupByNetworkFilterOption(checked)),
    []
  );

  const isNonDefaultOption = useMemo(() => !isEqual(options, DefaultTokensFilterOptions), [options]);

  const handleResetAllClick = useCallback(() => dispatch(resetTokensFilterOptions()), []);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-font-description-bold">
          <T id="filterTokens" />
        </p>

        {isNonDefaultOption && (
          <button onClick={handleResetAllClick} className="flex items-center text-secondary text-font-description-bold">
            <T id="resetAll" />
            <IconBase Icon={CleanIcon} size={12} />
          </button>
        )}
      </div>

      <NetworkSelect filterChain={filterChain} onClick={setNetworksModalOpen} />

      <div className="rounded-lg shadow-bottom border-0.5 border-transparent">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="hideZeroBalance" />
          </span>

          <ToggleSwitch checked={hideZeroBalance} onChange={handleHideZeroBalanceChange} />
        </div>

        <Divider style={{ height: '0.5px' }} />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="groupByNetwork" />
          </span>

          <ToggleSwitch checked={groupByNetwork} onChange={handleGroupByNetworkChange} />
        </div>
      </div>

      <NetworksModal opened={networksModalOpened} onRequestClose={setNetworksModalClosed} />
    </div>
  );
});

interface NetworkSelectProps {
  filterChain: FilterChain;
  onClick: EmptyFn;
}

const NetworkSelect = memo<NetworkSelectProps>(({ filterChain, onClick }) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const children: JSX.Element = useMemo(() => {
    if (!filterChain) {
      return (
        <>
          <IconBase Icon={Browse} className="text-primary" size={16} />
          <span className="text-font-medium-bold">
            <T id="allNetworks" />
          </span>
        </>
      );
    }

    if (filterChain.kind === TempleChainKind.Tezos) {
      return (
        <>
          {filterChain.chainId === TEZOS_MAINNET_CHAIN_ID ? (
            <TezosNetworkLogo size={24} />
          ) : (
            <IconBase Icon={Browse} size={16} className="mx-0.5" />
          )}
          <span className="text-font-medium-bold">{tezosChains[filterChain.chainId].name}</span>
        </>
      );
    }

    return (
      <>
        <EvmNetworkLogo chainId={filterChain.chainId} size={24} />
        <span className="text-font-medium-bold">{evmChains[filterChain.chainId].name}</span>
      </>
    );
  }, [filterChain, evmChains, tezosChains]);

  return (
    <div
      className="cursor-pointer mb-4 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">{children}</div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});
