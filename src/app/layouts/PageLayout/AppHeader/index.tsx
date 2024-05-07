import React, { memo } from 'react';

import clsx from 'clsx';

import { HashShortView, IconBase } from 'app/atoms';
import { AccountName } from 'app/atoms/AccountName';
import { ACTIONS_DROPDOWN_ITEM_CLASSNAME, ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { Button } from 'app/atoms/Button';
import Identicon from 'app/atoms/Identicon';
import { ReactComponent as BurgerIcon } from 'app/icons/menu.svg';
import { toastSuccess } from 'app/toaster';
import { useBooleanState } from 'lib/ui/hooks';
import Popper from 'lib/ui/Popper';
import { useAccount } from 'temple/front';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import AccountsDropdown from './AccountsDropdown';
import { AccountsModal } from './AccountsModal';
import MenuDropdown from './MenuDropdown';
import { AppHeaderSelectors } from './selectors';

/** TODO: || PageHeader || AppToolbar */
export const AppHeader = memo(() => {
  const account = useAccount();
  const [accountsModalOpened, setAccountsModalOpen, setAccountsModalClosed] = useBooleanState(false);

  return (
    <div className="flex items-center py-3 px-4 gap-x-1 bg-white">
      {/* <Popper placement="bottom-start" strategy="fixed" popup={props => <AccountsDropdown {...props} />}>
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
      </Popper> */}
      <Button
        className="flex p-px rounded-md border border-secondary hover:bg-secondary-low"
        onClick={setAccountsModalOpen}
        testID={AppHeaderSelectors.accountIcon}
      >
        <Identicon type="bottts" hash={account.id} size={28} className="rounded-sm" />
      </Button>

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

interface CopyAddressButtonProps {
  chain: TempleChainKind;
  address: string;
  onCopy: EmptyFn;
}

const CopyAddressButton = memo<CopyAddressButtonProps>(({ chain, address, onCopy }) => {
  return (
    <Button
      onClick={() => {
        window.navigator.clipboard.writeText(address);
        onCopy();
        toastSuccess('Address Copied');
      }}
      className={ACTIONS_DROPDOWN_ITEM_CLASSNAME}
    >
      <div className="flex flex-col gap-y-0.5 items-start">
        <span className="text-xs">{TempleChainTitle[chain]}</span>

        <span className="text-xxxs leading-3 text-grey-1">
          <HashShortView hash={address} />
        </span>
      </div>
    </Button>
  );
});
