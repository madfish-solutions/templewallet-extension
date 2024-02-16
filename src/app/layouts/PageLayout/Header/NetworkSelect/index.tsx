import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import Name from 'app/atoms/Name';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { T } from 'lib/i18n';
import { useNetwork } from 'lib/temple/front';
import Popper from 'lib/ui/Popper';

import { NetworkDropdown } from './NetworkDropdown';
import { NetworkSelectSelectors } from './selectors';

type NetworkSelectProps = HTMLAttributes<HTMLDivElement>;

const NetworkSelect: FC<NetworkSelectProps> = () => {
  const currentNetwork = useNetwork();

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={props => <NetworkDropdown currentNetwork={currentNetwork} {...props} />}
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
          testID={NetworkSelectSelectors.selectedNetworkButton}
        >
          <div
            className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
            style={{ backgroundColor: currentNetwork.color }}
          />

          <Name style={{ maxWidth: '7rem' }} testID={NetworkSelectSelectors.selectedNetworkButtonName}>
            {(currentNetwork.nameI18nKey && <T id={currentNetwork.nameI18nKey} />) || currentNetwork.name}
          </Name>

          <ChevronDownIcon className="ml-1 -mr-1 stroke-current stroke-2" style={{ height: 16, width: 'auto' }} />
        </Button>
      )}
    </Popper>
  );
};

export default NetworkSelect;
