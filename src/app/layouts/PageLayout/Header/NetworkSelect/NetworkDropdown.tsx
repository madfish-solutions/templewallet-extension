import React, { memo, useCallback } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import { BLOCK_EXPLORERS, useBlockExplorer } from 'lib/temple/front';
import { isKnownChainId } from 'lib/temple/types';
import { PopperRenderProps } from 'lib/ui/Popper';
import { HistoryAction, navigate } from 'lib/woozie';
import {
  useAllTezosNetworks,
  useAllEvmNetworks,
  useTezosNetwork,
  useChangeTezosNetwork,
  useChangeEvmNetwork
} from 'temple/front';
import { NetworkBase } from 'temple/networks';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainName, TempleChainTitle } from 'temple/types';

import { NetworkButton } from './NetworkButton';
import styles from './style.module.css';

interface Props extends PopperRenderProps {
  currentNetworkId: string;
}

export const TezosNetworkDropdown = memo<Props>(props => {
  const setOpened = props.setOpened;

  const allNetworks = useAllTezosNetworks();
  const changeNetwork = useChangeTezosNetwork();

  const { chainId } = useTezosNetwork();
  const { setExplorerId } = useBlockExplorer();

  const handleNetworkSelect = useCallback(
    async (netId: string, rpcUrl: string, selected: boolean) => {
      setOpened(false);

      if (selected) return;

      try {
        const currentChainId = await loadTezosChainId(rpcUrl);

        if (currentChainId && isKnownChainId(currentChainId)) {
          const currentBlockExplorerId =
            BLOCK_EXPLORERS.find(explorer => explorer.baseUrls.get(currentChainId))?.id ?? 'tzkt';

          if (currentChainId !== chainId) {
            setExplorerId(currentBlockExplorerId);
          }
        } else if (currentChainId !== chainId) {
          setExplorerId('tzkt');
        }
      } catch (error) {
        console.error(error);
      }

      changeNetwork(netId);
      navigate('/', HistoryAction.Replace);
    },
    [chainId, setExplorerId, setOpened, changeNetwork]
  );

  return (
    <NetworkDropdown
      {...props}
      chain={TempleChainName.Tezos}
      allNetworks={allNetworks}
      handleNetworkSelect={handleNetworkSelect}
    />
  );
});

export const EvmNetworkDropdown = memo<Props>(props => {
  const setOpened = props.setOpened;

  const allNetworks = useAllEvmNetworks();
  const changeNetwork = useChangeEvmNetwork();

  const handleNetworkSelect = useCallback(
    async (netId: string) => {
      setOpened(false);

      changeNetwork(netId);
      navigate('/', HistoryAction.Replace);
    },
    [setOpened, changeNetwork]
  );

  return (
    <NetworkDropdown
      {...props}
      chain={TempleChainName.EVM}
      allNetworks={allNetworks}
      handleNetworkSelect={handleNetworkSelect}
    />
  );
});

interface NetworkDropdownProps extends Props {
  chain: TempleChainName;
  allNetworks: NetworkBase[];
  handleNetworkSelect: (netId: string, rpcUrl: string, selected: boolean) => Promise<void>;
}

const NetworkDropdown = memo<NetworkDropdownProps>(
  ({ chain, allNetworks, opened, setOpened, currentNetworkId, handleNetworkSelect }) => {
    useShortcutAccountSelectModalIsOpened(() => setOpened(false));

    return (
      <DropdownWrapper opened={opened} design="dark" className="origin-top-right p-2">
        <div className={styles.scroll}>
          <h2
            className={classNames(
              'flex items-center mb-2 px-1 pb-1',
              'border-b border-white border-opacity-25',
              'text-white text-opacity-90 text-sm text-center'
            )}
          >
            <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
            {TempleChainTitle[chain]} <T id="networks" />
          </h2>

          {allNetworks.map(network => {
            const { id, rpcBaseURL } = network;
            const selected = id === currentNetworkId;

            return (
              <NetworkButton
                key={id}
                network={network}
                selected={selected}
                onClick={() => handleNetworkSelect(id, rpcBaseURL, selected)}
              />
            );
          })}
        </div>
      </DropdownWrapper>
    );
  }
);
