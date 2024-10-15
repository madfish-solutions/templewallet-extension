import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { IconBase } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { Size } from 'app/atoms/IconBase';
import { IconButton } from 'app/atoms/IconButton';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { isSearchStringApplicable, searchAndFilterItems } from 'lib/utils/search-items';
import { navigate } from 'lib/woozie';
import {
  OneOfChains,
  useAccount,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

const ALL_NETWORKS = 'All Networks';

interface Props {
  opened: boolean;
  selectedNetwork: FilterChain;
  onRequestClose: EmptyFn;
}

export const NetworkSelectModal = memo<Props>(({ opened, selectedNetwork, onRequestClose }) => {
  const handleNetworkSelect = useCallback(
    (network: OneOfChains | null) => {
      dispatch(setAssetsFilterChain(network));
      onRequestClose();
    },
    [onRequestClose]
  );

  return (
    <PageModal title="Select Network" opened={opened} onRequestClose={onRequestClose}>
      <NetworkSelectModalContent
        opened={opened}
        selectedNetwork={selectedNetwork}
        handleNetworkSelect={handleNetworkSelect}
      />
    </PageModal>
  );
});

interface ContentProps {
  opened: boolean;
  selectedNetwork: FilterChain;
  handleNetworkSelect: (chain: OneOfChains | null) => void;
}

export const NetworkSelectModalContent = memo<ContentProps>(({ opened, selectedNetwork, handleNetworkSelect }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const networks = useMemo(
    () => [...(accountTezAddress ? tezosChains : []), ...(accountEvmAddress ? evmChains : [])],
    [accountEvmAddress, accountTezAddress, evmChains, tezosChains]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

  const searchedNetworks = useMemo(
    () => (inSearch ? searchAndFilterChains(networks, searchValueDebounced) : networks),
    [inSearch, searchValueDebounced, networks]
  );

  useEffect(() => {
    if (searchValueDebounced) setAttractSelectedNetwork(false);
    else if (!opened) setAttractSelectedNetwork(true);
  }, [opened, searchValueDebounced]);

  const onNetworkSelect = useCallback(
    (network: OneOfChains | string) => {
      handleNetworkSelect(typeof network === 'string' ? null : network);
    },
    [handleNetworkSelect]
  );

  return (
    <>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-grow flex flex-col overflow-y-auto">
        {searchedNetworks.length === 0 ? (
          <EmptyState variant="searchUniversal" />
        ) : (
          !inSearch && (
            <Network
              network={ALL_NETWORKS}
              activeNetwork={selectedNetwork}
              attractSelf={attractSelectedNetwork}
              showBalance
              onClick={onNetworkSelect}
            />
          )
        )}

        {searchedNetworks.map(network => (
          <Network
            key={network.chainId}
            network={network}
            activeNetwork={selectedNetwork}
            attractSelf={attractSelectedNetwork}
            showBalance
            onClick={onNetworkSelect}
          />
        ))}
      </div>
    </>
  );
});

interface NetworkProps {
  network: OneOfChains | string;
  activeNetwork: FilterChain;
  attractSelf?: boolean;
  showBalance?: boolean;
  iconSize?: Size;
  onClick?: (network: OneOfChains | string) => void;
}

export const Network: FC<NetworkProps> = ({
  network,
  activeNetwork,
  attractSelf,
  showBalance = false,
  iconSize = 32,
  onClick
}) => {
  const isAllNetworks = typeof network === 'string';

  const active = isAllNetworks ? activeNetwork === null : network.chainId === activeNetwork?.chainId;

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  const account = useAccount();

  const Icon = useMemo(() => {
    if (isAllNetworks) return <IconBase Icon={Browse} className="text-primary mx-0.5" size={iconSize} />;

    if (network.kind === TempleChainKind.Tezos) return <TezosNetworkLogo chainId={network.chainId} size={iconSize} />;

    if (network.kind === TempleChainKind.EVM)
      return <EvmNetworkLogo chainId={network.chainId} size={iconSize} imgClassName="p-0.5" />;

    return null;
  }, [isAllNetworks, network, iconSize]);

  const handleClick = useCallback(() => onClick?.(network), [network, onClick]);

  return (
    <div
      ref={elemRef}
      className="cursor-pointer mb-3 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent group"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2">
        {Icon}

        <div className="flex flex-col">
          <span className="text-font-medium-bold">{isAllNetworks ? ALL_NETWORKS : network.name}</span>

          {showBalance && (
            <span className="text-grey-1 text-font-description">
              <T id="balance" />:{' '}
              <TotalEquity account={account} filterChain={isAllNetworks ? null : network} currency="fiat" />
            </span>
          )}
        </div>
      </div>

      <RadioButton active={active} className={active ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
};

function searchAndFilterChains(networks: OneOfChains[], searchValue: string) {
  return searchAndFilterItems(
    networks,
    searchValue.trim(),
    [
      { name: 'name', weight: 1 },
      { name: 'nameI18n', weight: 1 }
    ],
    ({ name, nameI18nKey }) => ({
      name,
      nameI18n: nameI18nKey ? t(nameI18nKey) : undefined
    })
  );
}
