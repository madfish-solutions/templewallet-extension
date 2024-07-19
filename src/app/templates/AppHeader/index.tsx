import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { Button } from 'app/atoms/Button';
import { useModalOpenSearchParams } from 'app/hooks/use-modal-open-search-params';
import { ReactComponent as BurgerIcon } from 'app/icons/base/menu.svg';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { HomeSelectors } from '../../pages/Home/selectors';

import { AccountsModal } from './AccountsModal';
import MenuDropdown from './MenuDropdown';

export const AppHeader = memo(() => {
  const account = useAccount();

  const {
    isOpen: accountsModalIsOpen,
    openModal: openAccountsModal,
    closeModal: closeAccountsModal
  } = useModalOpenSearchParams('accountsModal');

  return (
    <div className="relative z-header flex items-center py-3 px-4 gap-x-1 rounded-t-inherit">
      <AccountAvatar
        seed={account.id}
        size={32}
        onClick={openAccountsModal}
        testID={HomeSelectors.accountIcon}
        elementType="button"
      />

      <AccountsModal opened={accountsModalIsOpen} onRequestClose={closeAccountsModal} />

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
            testID={HomeSelectors.accountMenuButton}
          >
            <IconBase Icon={BurgerIcon} size={16} />
          </Button>
        )}
      </Popper>
    </div>
  );
});
