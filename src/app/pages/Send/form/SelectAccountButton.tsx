import React, { memo, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { TestIDProperty } from 'lib/analytics';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useVisibleAccounts } from 'temple/front';
import { useSettings } from 'temple/front/ready';

import DefaultAvatarImgSrc from './assets/default_avatar.png';

const DEFAULT_TITLE = 'Select account';
export const SELECT_ACCOUNT_BUTTON_ID = 'select-account-button';

interface Props extends TestIDProperty {
  value: string;
  onClick?: EmptyFn;
}

export const SelectAccountButton = memo<Props>(({ value: selectedAccountAddress, onClick, testID }) => {
  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const { title, iconHash } = useMemo(() => {
    const value = { title: DEFAULT_TITLE, iconHash: '' };

    if (!selectedAccountAddress) return value;

    allAccounts.forEach(acc => {
      const evmAddress = getAccountAddressForEvm(acc);
      const tezosAddress = getAccountAddressForTezos(acc);

      if (evmAddress === selectedAccountAddress || tezosAddress === selectedAccountAddress) {
        value.title = acc.name;
        value.iconHash = acc.id;
      }
    });

    contacts?.forEach(contact => {
      if (contact.address === selectedAccountAddress) {
        value.title = contact.name;
        value.iconHash = contact.address;
      }
    });

    return value;
  }, [allAccounts, contacts, selectedAccountAddress]);

  return (
    <Button
      id={SELECT_ACCOUNT_BUTTON_ID}
      className="w-full cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      testID={testID}
      onClick={onClick}
    >
      <div className="flex justify-center items-center gap-2">
        {iconHash ? (
          <AccountAvatar seed={iconHash} size={24} borderColor="secondary" />
        ) : (
          <div className="flex p-px rounded border border-secondary">
            <img src={DefaultAvatarImgSrc} alt="default-avatar" className="w-5 h-5" />
          </div>
        )}

        <span className="text-font-medium-bold">{title}</span>
      </div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </Button>
  );
});
