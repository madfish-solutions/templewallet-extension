import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { T } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';
import { TezosChain, EvmChain, useEnabledTezosChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainTitle } from 'temple/types';

import { ChainButton } from './ChainButton';
import { ChainSelectController } from './controller';
import styles from './style.module.css';

interface Props extends PopperRenderProps {
  controller: ChainSelectController;
}

export const ChainsDropdown = memo<Props>(({ opened, setOpened, controller }) => {
  const selectedChain = controller.value;

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

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
    <DropdownWrapper opened={opened} design="dark" className="origin-top-right mt-1 p-2">
      <div className={styles.scroll}>
        <h2 className={h2ClassName}>
          <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
          {TempleChainTitle.tezos} <T id="networks" />
        </h2>

        {tezosChains.map(chain => {
          const { chainId } = chain;
          const selected = chainId === selectedChain.chainId && selectedChain.kind === 'tezos';

          return (
            <ChainButton
              key={chainId}
              chain={chain}
              selected={selected}
              onClick={() => {
                setOpened(false);

                if (!selected) handleTezosNetworkSelect(chain);
              }}
            />
          );
        })}

        <h2 className={clsx(h2ClassName, 'mt-2')}>
          <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
          {TempleChainTitle.evm} <T id="networks" />
        </h2>

        {evmChains.map(chain => {
          const { chainId } = chain;
          const selected = chainId === selectedChain.chainId && selectedChain.kind === 'evm';

          return (
            <ChainButton
              key={chainId}
              chain={chain}
              selected={selected}
              onClick={() => {
                setOpened(false);

                if (!selected) handleEvmNetworkSelect(chain);
              }}
            />
          );
        })}
      </div>
    </DropdownWrapper>
  );
});
