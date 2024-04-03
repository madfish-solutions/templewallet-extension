import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { useAllTezosNetworks, useAllEvmNetworks } from 'temple/front';
import { isTezosNetwork, NetworkBase } from 'temple/networks';
import { TempleChainTitle } from 'temple/types';

import { NetworkSelectController } from './controller';
import { NetworkButton } from './NetworkButton';
import styles from './style.module.css';

interface Props extends PopperRenderProps {
  controller: NetworkSelectController;
}

export const NetworkDropdown = memo<Props>(({ opened, setOpened, controller }) => {
  const currentNetworkId = controller.network.id;
  const currentNetworkIsOfTezos = isTezosNetwork(controller.network);

  const allTezosNetworks = useAllTezosNetworks();
  const allEvmNetworks = useAllEvmNetworks();

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const handleTezosNetworkSelect = useCallback(
    (network: NetworkBase) => {
      controller.setNetwork(network);
    },
    [controller]
  );

  const handleEvmNetworkSelect = useCallback(
    (network: NetworkBase) => {
      controller.setNetwork(network);
    },
    [controller]
  );

  const h2ClassName = useMemo(
    () =>
      clsx(
        'flex items-center mb-2 px-1 pb-1',
        'border-b border-white border-opacity-25',
        'text-white text-opacity-90 text-sm text-center'
      ),
    []
  );

  return (
    <DropdownWrapper opened={opened} design="dark" className="origin-top-right p-2">
      <div className={styles.scroll}>
        <h2 className={h2ClassName}>
          <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
          {TempleChainTitle.tezos} <T id="networks" />
        </h2>

        {allTezosNetworks.map(network => {
          const { id } = network;
          const selected = id === currentNetworkId && currentNetworkIsOfTezos;

          return (
            <NetworkButton
              key={id}
              network={network}
              selected={selected}
              onClick={() => {
                setOpened(false);

                if (!selected) handleTezosNetworkSelect(network);
              }}
            />
          );
        })}

        <h2 className={clsx(h2ClassName, 'mt-2')}>
          <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
          {TempleChainTitle.evm} <T id="networks" />
        </h2>

        {allEvmNetworks.map(network => {
          const { id } = network;
          const selected = id === currentNetworkId && !currentNetworkIsOfTezos;

          return (
            <NetworkButton
              key={id}
              network={network}
              selected={selected}
              onClick={() => {
                setOpened(false);

                if (!selected) handleEvmNetworkSelect(network);
              }}
            />
          );
        })}
      </div>
    </DropdownWrapper>
  );
});
