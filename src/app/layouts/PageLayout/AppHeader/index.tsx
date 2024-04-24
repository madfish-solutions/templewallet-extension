import React, { memo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import Identicon from 'app/atoms/Identicon';
import Name from 'app/atoms/Name';
import { ReactComponent as BurgerIcon } from 'app/icons/burger.svg';
import { ReactComponent as CopyIcon } from 'app/icons/copy-files.svg';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import AccountsDropdown from './AccountsDropdown';
import MenuDropdown from './MenuDropdown';
import { AppHeaderSelectors } from './selectors';

/** TODO: || PageHeader || AppToolbar */
export const AppHeader = memo(() => {
  const account = useAccount();

  return (
    <div className="flex items-center py-3 px-4 gap-x-1 bg-white">
      <Popper placement="bottom-start" strategy="fixed" popup={props => <AccountsDropdown {...props} />}>
        {({ ref, toggleOpened }) => (
          <Button
            ref={ref}
            className="flex p-px rounded-md border border-secondary hover:bg-secondary-low"
            onClick={toggleOpened}
            testID={AppHeaderSelectors.accountIcon}
          >
            <Identicon type="bottts" hash={account.id} size={28} className="rounded-sm" />
          </Button>
        )}
      </Popper>

      <div className={clsx('flex items-center p-1.5 gap-x-1 text-sm leading-5', 'rounded-md hover:bg-secondary-low')}>
        <Name>{account.name}</Name>

        <CopyIcon className="ml-1 h-4 w-4 stroke-current fill-current text-secondary" />
      </div>

      <div className="flex-1" />

      <Popper placement="bottom-end" strategy="fixed" popup={props => <MenuDropdown {...props} />}>
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={clsx(
              'p-2 rounded-md text-secondary bg-secondary-low',
              'hover:text-secondary-hover hover:bg-secondary-low-hover',
              opened && 'text-secondary-hover bg-secondary-low-hover'
            )}
            onClick={toggleOpened}
            testID={AppHeaderSelectors.menuIcon}
          >
            <BurgerIcon className="h-4 w-4 stroke-current fill-current" />
          </Button>
        )}
      </Popper>
    </div>
  );
});
