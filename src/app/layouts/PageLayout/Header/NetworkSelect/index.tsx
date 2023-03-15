import React, { FC, HTMLAttributes, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Name from 'app/atoms/Name';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import {
  BLOCK_EXPLORERS,
  useBlockExplorer,
  useAllNetworks,
  useChainId,
  useNetwork,
  useSetNetworkId
} from 'lib/temple/front';
import { loadChainId } from 'lib/temple/helpers';
import { isKnownChainId } from 'lib/temple/types';
import Popper from 'lib/ui/Popper';

import { NetworkButton } from './NetworkButton';
import { NetworkSelectSelectors } from './selectors';
import styles from './style.module.css';

type NetworkSelectProps = HTMLAttributes<HTMLDivElement>;

const NetworkSelect: FC<NetworkSelectProps> = () => {
  const allNetworks = useAllNetworks();
  const currentNetwork = useNetwork();
  const setNetworkId = useSetNetworkId();

  const chainId = useChainId(true)!;
  const { setExplorerId } = useBlockExplorer();

  const filteredNetworks = useMemo(() => allNetworks.filter(n => !n.hidden), [allNetworks]);

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
      } catch {}

      setNetworkId(netId);
    },
    [setNetworkId, setExplorerId, chainId]
  );

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={({ opened, setOpened }) => (
        <DropdownWrapper opened={opened} className="origin-top-right p-2">
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
                  network={network}
                  selected={selected}
                  onClick={() => handleNetworkSelect(id, rpcBaseURL, selected, setOpened)}
                />
              );
            })}
          </div>
        </DropdownWrapper>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={classNames(
            'flex items-center px-2 py-1 select-none',
            'text-xs font-medium bg-white bg-opacity-10 rounded',
            'border border-primary-orange border-opacity-25',
            'text-primary-white text-shadow-black',
            'transition ease-in-out duration-200',
            opened ? 'shadow-md' : 'shadow hover:shadow-md focus:shadow-md',
            opened ? 'opacity-100' : 'opacity-90 hover:opacity-100 focus:opacity-100'
          )}
          onClick={toggleOpened}
          testID={NetworkSelectSelectors.selectedNetworkButton}
        >
          <div
            className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
            style={{ backgroundColor: currentNetwork.color }}
          />

          <Name style={{ maxWidth: '7rem' }}>
            {(currentNetwork.nameI18nKey && <T id={currentNetwork.nameI18nKey} />) || currentNetwork.name}
          </Name>

          <ChevronDownIcon className="ml-1 -mr-1 stroke-current stroke-2" style={{ height: 16, width: 'auto' }} />
        </Button>
      )}
    </Popper>
  );
};

export default NetworkSelect;
