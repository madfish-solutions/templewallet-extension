import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { TezosChain, EvmChain, useAllTezosChains, useAllEvmChains } from 'temple/front';
import { TempleChainTitle } from 'temple/types';

import { ChainButton } from './ChainButton';
import { ChainSelectController } from './controller';
import styles from './style.module.css';

interface Props extends PopperRenderProps {
  controller: ChainSelectController;
}

export const ChainsDropdown = memo<Props>(({ opened, setOpened, controller }) => {
  const selectedChain = controller.value;

  const allTezosChains = useAllTezosChains();
  const allEvmNetworks = useAllEvmChains();

  const tezosNetworks = useMemo(() => Object.values(allTezosChains), [allTezosChains]);
  const evmNetworks = useMemo(() => Object.values(allEvmNetworks), [allEvmNetworks]);

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const handleTezosNetworkSelect = useCallback(
    (network: TezosChain) => {
      controller.setValue(network);
    },
    [controller]
  );

  const handleEvmNetworkSelect = useCallback(
    (network: EvmChain) => {
      controller.setValue(network);
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
    <DropdownWrapper opened={opened} design="dark" className="origin-top-right p-2 abcdef">
      <div className={styles.scroll}>
        <h2 className={h2ClassName}>
          <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
          {TempleChainTitle.tezos} <T id="networks" />
        </h2>

        {tezosNetworks.map(network => {
          const { chainId } = network;
          const selected = chainId === selectedChain.chainId && selectedChain.kind === 'tezos';

          return (
            <ChainButton
              key={chainId}
              chain={network}
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

        {evmNetworks.map(network => {
          const { chainId } = network;
          const selected = chainId === selectedChain.chainId && selectedChain.kind === 'evm';

          return (
            <ChainButton
              key={chainId}
              chain={network}
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
