import React, { memo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { Button } from 'app/atoms/Button';
import { ReactComponent as BurgerIcon } from 'app/icons/base/menu.svg';
import { useBooleanState } from 'lib/ui/hooks';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { AccountsModal } from './AccountsModal';
import MenuDropdown from './MenuDropdown';
import { AppHeaderSelectors } from './selectors';

export const AppHeader = memo(() => {
  const account = useAccount();
  const [accountsModalOpened, setAccountsModalOpen, setAccountsModalClosed] = useBooleanState(false);

  return (
    <div className="relative z-header flex items-center py-3 px-4 gap-x-1 rounded-t-inherit">
      <AccountAvatar
        seed={account.id}
        size={32}
        onClick={setAccountsModalOpen}
        testID={AppHeaderSelectors.accountIcon}
        elementType="button"
      />

      <AccountsModal opened={accountsModalOpened} onRequestClose={setAccountsModalClosed} />

      <AccountName account={account} />

      <div className="flex-1" />

      <Popper placement="bottom-end" strategy="fixed" popup={props => <MenuDropdown {...props} />}>
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={clsx(
              'p-1 rounded-md text-secondary bg-secondary-low',
              'hover:text-secondary-hover hover:bg-secondary-hover-low',
              opened && 'text-secondary-hover bg-secondary-hover-low'
            )}
            onClick={toggleOpened}
            testID={AppHeaderSelectors.menuIcon}
          >
            <IconBase Icon={BurgerIcon} size={16} />
          </Button>
        )}
      </Popper>
    </div>
  );
});
