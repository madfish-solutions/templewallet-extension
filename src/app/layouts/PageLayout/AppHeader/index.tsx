import React, { memo } from 'react';

import clsx from 'clsx';

import { HashShortView, IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Identicon from 'app/atoms/Identicon';
import Name from 'app/atoms/Name';
import { ReactComponent as BurgerIcon } from 'app/icons/burger.svg';
import { ReactComponent as CopyIcon } from 'app/icons/copy-files.svg';
import { toastSuccess } from 'app/toaster';
import Popper from 'lib/ui/Popper';
import { getAccountAddressForTezos, getAccountAddressForEvm } from 'temple/accounts';
import { useAccount } from 'temple/front';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import AccountsDropdown from './AccountsDropdown';
import MenuDropdown from './MenuDropdown';
import { AppHeaderSelectors } from './selectors';

/** TODO: || PageHeader || AppToolbar */
export const AppHeader = memo(() => {
  const account = useAccount();

  const accountTezosAddress = getAccountAddressForTezos(account);
  const accountEvmAddress = getAccountAddressForEvm(account);

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

      <Popper
        placement="bottom-start"
        strategy="fixed"
        popup={props => {
          //
          return (
            <DropdownWrapper opened={props.opened} design="day" className="p-2 flex flex-col" style={{ minWidth: 173 }}>
              <h6 className="py-2.5 px-2 text-xxxs leading-3 font-semibold text-gray-550">Select Address to copy</h6>

              {accountTezosAddress ? (
                <CopyAddressButton
                  chain={TempleChainKind.Tezos}
                  address={accountTezosAddress}
                  onCopy={props.toggleOpened}
                />
              ) : null}

              {accountEvmAddress ? (
                <CopyAddressButton
                  chain={TempleChainKind.EVM}
                  address={accountEvmAddress}
                  onCopy={props.toggleOpened}
                />
              ) : null}
            </DropdownWrapper>
          );
        }}
      >
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={clsx(
              'flex items-center p-1.5 gap-x-1 text-sm leading-5 rounded-md',
              opened ? 'bg-secondary-low' : 'hover:bg-secondary-low'
            )}
            onClick={toggleOpened}
            testID={AppHeaderSelectors.menuIcon}
          >
            <Name>{account.name}</Name>

            <IconBase Icon={CopyIcon} size={12} className="ml-1 text-secondary" />
          </Button>
        )}
      </Popper>

      <div className="flex-1" />

      <Popper placement="bottom-end" strategy="fixed" popup={props => <MenuDropdown {...props} />}>
        {({ ref, opened, toggleOpened }) => (
          <Button
            ref={ref}
            className={clsx(
              'p-1 rounded-md text-secondary bg-secondary-low',
              'hover:text-secondary-hover hover:bg-secondary-low-hover',
              opened && 'text-secondary-hover bg-secondary-low-hover'
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
      className={clsx('flex items-center py-1.5 px-2 rounded-md', 'hover:bg-secondary-low')}
    >
      <div className="flex flex-col gap-y-0.5 items-start">
        <span className="text-xs">{TempleChainTitle[chain]}</span>
        <span className="text-xxxs leading-3 text-gray-550">
          <HashShortView hash={address} />
        </span>
      </div>
    </Button>
  );
});
