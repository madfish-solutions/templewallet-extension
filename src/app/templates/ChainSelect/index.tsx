import React, { memo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import Name from 'app/atoms/Name';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import Popper from 'lib/ui/Popper';
import { getNetworkTitle } from 'temple/front/networks';

import { ChainSelectController } from './controller';
import { ChainDropdown } from './NetworkDropdown';

export { useChainSelectController } from './controller';

interface Props {
  controller: ChainSelectController;
}

export const ChainSelect = memo<Props>(({ controller }) => {
  const selectedChain = controller.value;

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={props => <ChainDropdown controller={controller} {...props} />}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={clsx(
            'flex items-center px-2 py-1 select-none',
            'text-xs font-medium bg-primary-orange bg-opacity-95 rounded',
            'border border-primary-orange border-opacity-25',
            'text-primary-white text-shadow-black',
            'transition ease-in-out duration-200',
            opened
              ? 'shadow-md opacity-100'
              : 'shadow hover:shadow-md focus:shadow-md opacity-90 hover:opacity-100 focus:opacity-100'
          )}
          onClick={toggleOpened}
        >
          <div
            className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
            style={{ backgroundColor: selectedChain.color }}
          />

          <Name style={{ maxWidth: '7rem' }}>{getNetworkTitle(selectedChain)}</Name>

          <ChevronDownIcon className="ml-1 -mr-1 stroke-current stroke-2" style={{ height: 16, width: 'auto' }} />
        </Button>
      )}
    </Popper>
  );
});
