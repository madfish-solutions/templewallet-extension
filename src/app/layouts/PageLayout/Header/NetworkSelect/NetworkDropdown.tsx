import React, { memo, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import { BLOCK_EXPLORERS, useAllNetworks, useBlockExplorer, useChainId, useSetNetworkId } from 'lib/temple/front';
import { loadChainId } from 'lib/temple/helpers';
import { isKnownChainId, TempleNetwork } from 'lib/temple/types';
import { PopperRenderProps } from 'lib/ui/Popper';
import { HistoryAction, navigate } from 'lib/woozie';

import { NetworkButton } from './NetworkButton';
import styles from './style.module.css';

interface Props extends PopperRenderProps {
  currentNetwork: TempleNetwork;
}

export const NetworkDropdown = memo<Props>(({ opened, setOpened, currentNetwork }) => {
  const allNetworks = useAllNetworks();
  const setNetworkId = useSetNetworkId();

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const filteredNetworks = useMemo(() => allNetworks.filter(n => !n.hidden), [allNetworks]);

  const chainId = useChainId(true)!;
  const { setExplorerId } = useBlockExplorer();

  const handleNetworkSelect = useCallback(
    async (netId: string, rpcUrl: string, selected: boolean, setOpened: (o: boolean) => void) => {
      setOpened(false);

      if (selected) return;

      try {
        const currentChainId = await loadChainId(rpcUrl);

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

      setNetworkId(netId);
      navigate('/', HistoryAction.Replace);
    },
    [setNetworkId, setExplorerId, chainId]
  );

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
          <T id="networks" />
        </h2>

        {filteredNetworks.map(network => {
          const { id, rpcBaseURL } = network;
          const selected = id === currentNetwork.id;

          return (
            <NetworkButton
              key={id}
              network={network}
              selected={selected}
              onClick={() => handleNetworkSelect(id, rpcBaseURL, selected, setOpened)}
            />
          );
        })}
      </div>
    </DropdownWrapper>
  );
});
