import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { IconBase } from 'app/atoms';
import { IconButton } from 'app/atoms/IconButton';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import { T } from 'lib/i18n';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { navigate } from 'lib/woozie';
import {
  EvmChain,
  TezosChain,
  useAccount,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EmptyNetworksSearch } from './EmptyNetworksSearch';

const ALL_NETWORKS = 'All Networks';

type Network = TezosChain | EvmChain | string;

interface Props {
  opened: boolean;
  selectedNetwork: FilterChain;
  onRequestClose: EmptyFn;
}

export const NetworkSelectModal = memo<Props>(({ opened, selectedNetwork, onRequestClose }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const networks = useMemo(
    () => [ALL_NETWORKS, ...(accountTezAddress ? tezosChains : []), ...(accountEvmAddress ? evmChains : [])],
    [accountEvmAddress, accountTezAddress, evmChains, tezosChains]
  );

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

  const filteredNetworks = useMemo(
    () =>
      searchValueDebounced.length
        ? searchAndFilterNetworksByName<string | EvmChain | TezosChain>(networks, searchValueDebounced)
        : networks,
    [searchValueDebounced, networks]
  );

  useEffect(() => {
    if (searchValueDebounced) setAttractSelectedNetwork(false);
    else if (!opened) setAttractSelectedNetwork(true);
  }, [opened, searchValueDebounced]);

  const handleNetworkSelect = useCallback(
    (network: Network) => {
      dispatch(setAssetsFilterChain(typeof network === 'string' ? null : network));
      onRequestClose();
    },
    [onRequestClose]
  );

  return (
    <PageModal title="Select Network" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">
        {filteredNetworks.length === 0 && <EmptyNetworksSearch />}

        {filteredNetworks.map(network => (
          <Network
            key={typeof network === 'string' ? ALL_NETWORKS : network.chainId}
            network={network}
            activeNetwork={selectedNetwork}
            attractSelf={attractSelectedNetwork}
            showBalance
            onClick={handleNetworkSelect}
          />
        ))}
      </div>

      <div className="p-4 pb-6 flex flex-col bg-white">
        <StyledButton size="L" color="primary-low" onClick={onRequestClose}>
          <T id="close" />
        </StyledButton>
      </div>
    </PageModal>
  );
});

interface NetworkProps {
  network: Network;
  activeNetwork: FilterChain;
  attractSelf?: boolean;
  showBalance?: boolean;
  onClick?: (network: Network) => void;
}

export const Network: FC<NetworkProps> = ({ network, activeNetwork, attractSelf, showBalance = false, onClick }) => {
  const isAllNetworks = typeof network === 'string';

  const active = isAllNetworks ? activeNetwork === null : network?.chainId === activeNetwork?.chainId;

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  const account = useAccount();

  const Icon = useMemo(() => {
    if (isAllNetworks) return <IconBase Icon={Browse} className="text-primary mx-0.5" size={32} />;

    if (network?.kind === TempleChainKind.Tezos)
      return <TezosNetworkLogo networkName={network.name} chainId={network.chainId} size={36} />;

    if (network?.kind === TempleChainKind.EVM)
      return <EvmNetworkLogo networkName={network.name} chainId={network.chainId} size={36} imgClassName="p-0.5" />;

    return null;
  }, [isAllNetworks, network]);

  const handleClick = useCallback(() => onClick?.(network), [network]);

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

type SearchNetwork = string | { name: string };

const searchAndFilterNetworksByName = <T extends SearchNetwork>(networks: T[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return networks.filter(network => {
    if (typeof network === 'string') return network.toLowerCase().includes(preparedSearchValue);

    return network.name.toLowerCase().includes(preparedSearchValue);
  });
};
