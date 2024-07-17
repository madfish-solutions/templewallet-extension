import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { IconButton } from 'app/atoms/IconButton';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { ReactComponent as Browse } from 'app/icons/base/browse.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as EmptySearchIcon } from 'app/icons/search_empty.svg';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { FilterChain } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import { T, t } from 'lib/i18n';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { navigate } from 'lib/woozie';
import { EvmChain, TezosChain, useAccount } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSortedNetworks } from './hooks/use-sorted-networks';
import { searchAndFilterNetworks } from './utils/search-and-filter-networks';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const NetworksModal = memo<Props>(({ opened, onRequestClose }) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const sortedNetworks = useSortedNetworks();

  const [searchValue, setSearchValue] = useState('');

  const [attractSelectedNetwork, setAttractSelectedNetwork] = useState(true);

  const filteredNetworks = useMemo(
    () =>
      searchValue.length
        ? searchAndFilterNetworks<string | EvmChain | TezosChain>(sortedNetworks, searchValue)
        : sortedNetworks,
    [searchValue, sortedNetworks]
  );

  useEffect(() => {
    if (searchValue) setAttractSelectedNetwork(false);
    else if (!opened) setAttractSelectedNetwork(true);
  }, [opened, searchValue]);

  return (
    <PageModal title="Select Network" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">
        {filteredNetworks.length === 0 && (
          <div className="w-full h-full flex flex-col items-center">
            <div className="flex-1 py-7 flex flex-col items-center justify-center text-grey-2">
              <EmptySearchIcon />

              <p className="mt-2 text-center text-font-medium-bold">
                <T id="notFound" />
              </p>
            </div>
          </div>
        )}

        {filteredNetworks.map(network => {
          if (typeof network === 'string') {
            return (
              <Network
                key={network}
                active={!filterChain}
                icon={<IconBase Icon={Browse} className="text-primary mx-0.5" size={32} />}
                name={t('allNetworks')}
                balanceFilterChain={null}
                attractSelf={attractSelectedNetwork}
                onClick={() => dispatch(setAssetsFilterChain(null))}
              />
            );
          }

          if (network.kind === TempleChainKind.Tezos) {
            return (
              <Network
                key={network.chainId}
                active={filterChain?.kind === TempleChainKind.Tezos && filterChain.chainId === network.chainId}
                icon={
                  network.chainId === TEZOS_MAINNET_CHAIN_ID ? (
                    <TezosNetworkLogo size={36} />
                  ) : (
                    <NetworkLogoFallback networkName={network.name} size={36} />
                  )
                }
                name={network.name}
                balanceFilterChain={network}
                attractSelf={attractSelectedNetwork}
                onClick={() =>
                  dispatch(setAssetsFilterChain({ kind: TempleChainKind.Tezos, chainId: network.chainId }))
                }
              />
            );
          }

          return (
            <Network
              key={network.chainId}
              active={filterChain?.kind === TempleChainKind.EVM && filterChain.chainId === network.chainId}
              icon={
                <EvmNetworkLogo networkName={network.name} chainId={network.chainId} size={36} imgClassName="p-0.5" />
              }
              name={network.name}
              balanceFilterChain={network}
              attractSelf={attractSelectedNetwork}
              onClick={() => dispatch(setAssetsFilterChain({ kind: TempleChainKind.EVM, chainId: network.chainId }))}
            />
          );
        })}
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
  active: boolean;
  icon: JSX.Element;
  name: string;
  attractSelf: boolean;
  balanceFilterChain: FilterChain;
  onClick: EmptyFn;
}

const Network: FC<NetworkProps> = ({ active, icon, name, balanceFilterChain, attractSelf, onClick }) => {
  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  const account = useAccount();

  return (
    <div
      ref={elemRef}
      className="cursor-pointer mb-3 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent group"
      onClick={onClick}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <div className="flex flex-col">
          <span className="text-font-medium-bold">{name}</span>
          <span className="text-grey-1 text-font-description">
            <T id="balance" />: <TotalEquity account={account} filterChain={balanceFilterChain} currency="fiat" />
          </span>
        </div>
      </div>
      <RadioButton active={active} className={active ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
};
