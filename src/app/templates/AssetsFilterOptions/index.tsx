import React, { memo, RefObject, useCallback, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';
import useOnClickOutside from 'use-onclickoutside';

import { Divider, IconBase, ToggleSwitch } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { ReactComponent as CleanIcon } from 'app/icons/base/x_circle_fill.svg';
import { ContentContainer } from 'app/layouts/containers';
import { dispatch } from 'app/store';
import {
  resetTokensFilterOptions,
  setCollectiblesBlurFilterOption,
  setCollectiblesShowInfoFilterOption,
  setTokensGroupByNetworkFilterOption,
  setTokensHideZeroBalanceFilterOption
} from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState, FilterChain } from 'app/store/assets-filter-options/state';
import { T } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { NetworksModal } from './NetworksModal';

interface AssetsFilterOptionsProps {
  filterButtonRef: RefObject<HTMLButtonElement>;
  onRequestClose: EmptyFn;
}

export const AssetsFilterOptions = memo<AssetsFilterOptionsProps>(({ filterButtonRef, onRequestClose }) => {
  const options = useAssetsFilterOptionsSelector();
  const { filterChain, tokensListOptions, collectiblesListOptions } = options;

  const [networksModalOpened, setNetworksModalOpen, setNetworksModalClosed] = useBooleanState(false);

  const isNonDefaultOption = useMemo(() => !isEqual(options, AssetsFilterOptionsInitialState), [options]);

  const containerRef = useRef(null);

  useOnClickOutside(
    containerRef,
    networksModalOpened
      ? null
      : evt => {
          // @ts-expect-error
          if (!(filterButtonRef.current && filterButtonRef.current.contains(evt.target))) {
            onRequestClose();
          }
        }
  );

  const handleResetAllClick = useCallback(() => dispatch(resetTokensFilterOptions()), []);

  const handleTokensHideZeroBalanceChange = useCallback(
    (checked: boolean) => dispatch(setTokensHideZeroBalanceFilterOption(checked)),
    []
  );
  const handleTokensGroupByNetworkChange = useCallback(
    (checked: boolean) => dispatch(setTokensGroupByNetworkFilterOption(checked)),
    []
  );

  const handleCollectiblesBlurChange = useCallback(
    (checked: boolean) => dispatch(setCollectiblesBlurFilterOption(checked)),
    []
  );
  const handleCollecytiblesShowInfoChange = useCallback(
    (checked: boolean) => dispatch(setCollectiblesShowInfoFilterOption(checked)),
    []
  );

  return (
    <ContentContainer ref={containerRef}>
      <div className="flex justify-between items-center mt-1 mb-2">
        <p className="text-font-description-bold">
          <T id="sortByNetwork" />
        </p>

        {isNonDefaultOption && (
          <button onClick={handleResetAllClick} className="flex items-center text-secondary text-font-description-bold">
            <T id="resetAll" />
            <IconBase Icon={CleanIcon} size={12} />
          </button>
        )}
      </div>

      <NetworkSelect filterChain={filterChain} onClick={setNetworksModalOpen} />

      <p className="text-font-description-bold mt-5 mb-2">
        <T id="tokensList" />
      </p>

      <div className="rounded-lg shadow-bottom border-0.5 border-transparent">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="hideZeroBalance" />
          </span>

          <ToggleSwitch checked={tokensListOptions.hideZeroBalance} onChange={handleTokensHideZeroBalanceChange} />
        </div>

        <Divider style={{ height: '0.5px' }} />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="groupByNetwork" />
          </span>

          <ToggleSwitch checked={tokensListOptions.groupByNetwork} onChange={handleTokensGroupByNetworkChange} />
        </div>
      </div>

      <p className="text-font-description-bold mt-5 mb-2">
        <T id="collectiblesList" />
      </p>

      <div className="rounded-lg shadow-bottom border-0.5 border-transparent">
        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="blur" />
          </span>

          <ToggleSwitch checked={collectiblesListOptions.blur} onChange={handleCollectiblesBlurChange} />
        </div>

        <Divider style={{ height: '0.5px' }} />

        <div className="flex justify-between items-center p-3">
          <span className="text-font-medium-bold">
            <T id="showInfo" />
          </span>

          <ToggleSwitch checked={collectiblesListOptions.showInfo} onChange={handleCollecytiblesShowInfoChange} />
        </div>
      </div>

      <NetworksModal opened={networksModalOpened} onRequestClose={setNetworksModalClosed} />
    </ContentContainer>
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
      const networkName = tezosChains[filterChain.chainId].name;

      return (
        <>
          {filterChain.chainId === TEZOS_MAINNET_CHAIN_ID ? (
            <TezosNetworkLogo size={24} />
          ) : (
            <NetworkLogoFallback networkName={networkName} />
          )}
          <span className="text-font-medium-bold">{networkName}</span>
        </>
      );
    }

    const networkName = evmChains[filterChain.chainId].name;

    return (
      <>
        <EvmNetworkLogo networkName={networkName} chainId={filterChain.chainId} size={24} imgClassName="p-0.5" />
        <span className="text-font-medium-bold">{networkName}</span>
      </>
    );
  }, [filterChain, evmChains, tezosChains]);

  return (
    <div
      className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">{children}</div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});
