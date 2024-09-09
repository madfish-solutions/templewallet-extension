import React, { memo, useMemo } from 'react';

import { IconBase } from 'app/atoms';
import Identicon from 'app/atoms/Identicon';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useVisibleAccounts } from 'temple/front';
import { useSettings } from 'temple/front/ready';

import DefaultAvatarImg from './assets/default_avatar.png';

const DEFAULT_TITLE = 'Select account';

interface Props {
  value: string;
  onClick?: EmptyFn;
}

export const SelectAccountButton = memo<Props>(({ value: selectedAccountAddress, onClick }) => {
  const isDefaultValue = !selectedAccountAddress;

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const { title, iconHash } = useMemo(() => {
    const value = { title: DEFAULT_TITLE, iconHash: '' };

    if (isDefaultValue) return value;

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
  }, [allAccounts, contacts, isDefaultValue, selectedAccountAddress]);

  return (
    <div
      className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onClick}
    >
      <div className="flex justify-center items-center gap-2">
        <div className="flex p-px rounded border border-secondary">
          {isDefaultValue ? (
            <img src={DefaultAvatarImg} alt="default-avatar" className="w-5 h-5" />
          ) : (
            <Identicon type="bottts" hash={iconHash} size={20} />
          )}
        </div>
        <span className="text-font-medium-bold">{title}</span>
      </div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});
