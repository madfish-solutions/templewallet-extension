import React, { memo } from 'react';

import clsx from 'clsx';

import { HashShortView } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Identicon from 'app/atoms/Identicon';
import Name from 'app/atoms/Name';
import { ReactComponent as BurgerIcon } from 'app/icons/burger.svg';
import { ReactComponent as CopyIcon } from 'app/icons/copy-files.svg';
import Popper from 'lib/ui/Popper';
import { useClipboardWrite } from 'lib/ui/useCopyToClipboard';
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
            <DropdownWrapper opened={props.opened} design="day">
              <div className="p-2 flex flex-col" style={{ width: 173 }}>
                <h6 className="py-2.5 px-2 text-xxxs leading-3 font-semibold text-gray-550">Select Address to copy</h6>

                {accountTezosAddress ? (
                  <CopyAddressButton chain={TempleChainKind.Tezos} address={accountTezosAddress} />
                ) : null}

                {accountEvmAddress ? (
                  <CopyAddressButton chain={TempleChainKind.EVM} address={accountEvmAddress} />
                ) : null}
              </div>
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

            <CopyIcon className="ml-1 h-4 w-4 stroke-current fill-current text-secondary" />
          </Button>
        )}
      </Popper>

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

interface CopyAddressButtonProps {
  chain: TempleChainKind;
  address: string;
}

const CopyAddressButton = memo<CopyAddressButtonProps>(({ chain, address }) => {
  const { copied, copy } = useClipboardWrite();

  return (
    <Button
      onClick={() => void copy(address)}
      className={clsx('flex items-center py-1.5 px-2 rounded-md', 'hover:bg-secondary-low')}
    >
      <div className="flex flex-col gap-y-0.5 items-start">
        <span className="text-xs">{TempleChainTitle[chain]}</span>
        <span className="text-xxxs leading-3 text-gray-550">
          {copied ? 'copied' : <HashShortView hash={address} />}
        </span>
      </div>
    </Button>
  );
});
