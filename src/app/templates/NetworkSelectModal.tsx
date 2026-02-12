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
import { useGetEvmChainAccountTotalBalance } from 'app/hooks/total-balance/use-evm-account-total-balance';
import { useTezosTotalBalance } from 'app/hooks/total-balance/use-tezos-total-balance';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { SearchBarField } from 'app/templates/SearchField';
import { t, T } from 'lib/i18n';
import { searchAndFilterChains } from 'lib/ui/search-networks';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { isSearchStringApplicable } from 'lib/utils/search-items';
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
    <PageModal title={<T id="selectNetwork" />} opened={opened} onRequestClose={onRequestClose}>
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
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const totalTezBalanceInDollar = useTezosTotalBalance(accountTezAddress ?? '');
  const getEvmChainAccountTotalBalance = useGetEvmChainAccountTotalBalance(accountEvmAddress ?? '0x');
  const getChainTotalBalance = useCallback(
    (chain: OneOfChains) =>
      chain.kind === TempleChainKind.Tezos ? totalTezBalanceInDollar : getEvmChainAccountTotalBalance(chain.chainId),
    [getEvmChainAccountTotalBalance, totalTezBalanceInDollar]
  );

  const networks = useMemo(() => {
    const tezNetworks: OneOfChains[] = accountTezAddress ? tezosChains : [];

    const allNetworks = tezNetworks.concat(accountEvmAddress ? evmChains : []);

    if (!testnetModeEnabled) {
      allNetworks.sort(
        (aNetwork, bNetwork) => Number(getChainTotalBalance(bNetwork)) - Number(getChainTotalBalance(aNetwork))
      );
    }

    return allNetworks;
  }, [accountEvmAddress, accountTezAddress, evmChains, getChainTotalBalance, testnetModeEnabled, tezosChains]);

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
      <div className="flex gap-x-2 p-4 pb-3">
        <SearchBarField value={searchValue} placeholder={t('searchNetworkName')} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => navigate('settings/networks')} />
      </div>

      <div className="px-4 py-1 flex-grow flex flex-col gap-3 overflow-y-auto">
        {searchedNetworks.length === 0 ? (
          <EmptyState />
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
      className="cursor-pointer flex justify-between items-center p-3 rounded-8 border-0.5 bg-white border-lines group"
      onClick={handleClick}
    >
      <div className="flex items-center gap-x-2">
        {Icon}

        <div className="flex flex-col">
          <span className="text-font-medium-bold">{isAllNetworks ? <T id="allNetworks" /> : network.name}</span>

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
