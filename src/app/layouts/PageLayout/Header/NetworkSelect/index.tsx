import React, { memo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import Name from 'app/atoms/Name';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import Popper from 'lib/ui/Popper';
import { getNetworkTitle } from 'temple/front/networks';
import { NetworkBase } from 'temple/networks';
import { TempleChainName } from 'temple/types';

import { TezosNetworkDropdown, EvmNetworkDropdown } from './NetworkDropdown';
import { NetworkSelectSelectors } from './selectors';

interface Props {
  chain: TempleChainName;
  currentNetwork: NetworkBase;
}

const NetworkSelect = memo<Props>(({ chain, currentNetwork }) => {
  const isForTezos = chain === TempleChainName.Tezos;

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={props =>
        isForTezos ? (
          <TezosNetworkDropdown currentNetworkId={currentNetwork.id} {...props} />
        ) : (
          <EvmNetworkDropdown currentNetworkId={currentNetwork.id} {...props} />
        )
      }
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
            opened
              ? 'shadow-md opacity-100'
              : 'shadow hover:shadow-md focus:shadow-md opacity-90 hover:opacity-100 focus:opacity-100'
          )}
          onClick={toggleOpened}
          testID={isForTezos ? NetworkSelectSelectors.selectedNetworkButton : undefined}
        >
          <div
            className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
            style={{ backgroundColor: currentNetwork.color }}
          />

          <Name
            style={{ maxWidth: '7rem' }}
            testID={isForTezos ? NetworkSelectSelectors.selectedNetworkButtonName : undefined}
          >
            {getNetworkTitle(currentNetwork)}
          </Name>

          <ChevronDownIcon className="ml-1 -mr-1 stroke-current stroke-2" style={{ height: 16, width: 'auto' }} />
        </Button>
      )}
    </Popper>
  );
});

export default NetworkSelect;
