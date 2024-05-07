import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { HashShortView, IconBase } from 'app/atoms';
import { ACTIONS_DROPDOWN_ITEM_CLASSNAME, ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { Button } from 'app/atoms/Button';
import Name from 'app/atoms/Name';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { toastSuccess } from 'app/toaster';
import { StoredAccount } from 'lib/temple/types';
import Popper from 'lib/ui/Popper';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

interface Props {
  account: StoredAccount;
  smaller?: boolean;
}

export const AccountName = memo<Props>(({ account, smaller }) => {
  const accountTezosAddress = useMemo(() => getAccountAddressForTezos(account), [account]);
  const accountEvmAddress = useMemo(() => getAccountAddressForEvm(account), [account]);

  return (
    <Popper
      placement="bottom-start"
      strategy="fixed"
      popup={props => (
        <ActionsDropdownPopup
          title={() => 'Select Address to copy'}
          opened={props.opened}
          lowered
          style={{ minWidth: 173 }}
        >
          {accountTezosAddress ? (
            <CopyAddressButton
              chain={TempleChainKind.Tezos}
              address={accountTezosAddress}
              onCopy={props.toggleOpened}
            />
          ) : null}

          {accountEvmAddress ? (
            <CopyAddressButton chain={TempleChainKind.EVM} address={accountEvmAddress} onCopy={props.toggleOpened} />
          ) : null}
        </ActionsDropdownPopup>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={clsx(
            'flex items-center gap-x-1 rounded-md',
            smaller ? 'py-1.5 px-2' : 'p-1.5',
            opened ? 'bg-secondary-low' : 'hover:bg-secondary-low'
          )}
          onClick={toggleOpened}
        >
          <Name className="text-sm leading-5 font-semibold">{account.name}</Name>

          <IconBase Icon={CopyIcon} size={12} className="ml-1 text-secondary" />
        </Button>
      )}
    </Popper>
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
