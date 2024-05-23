import React, { memo, useMemo } from 'react';

import { HashShortView } from 'app/atoms';
import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import CopyButton from 'app/atoms/CopyButton';
import { StoredAccount } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { getAccountAddressForChain } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

interface AccountAddressesModalProps {
  account: StoredAccount;
  onClose: () => void;
}

const addressesEntryClassName = 'w-full h-12 flex justify-between items-center px-3 rounded-lg border border-gray-300';
const addressesEntryTextClassName = 'text-font-medium-bold text-gray-900 leading-5';

export const AccountAddressesModal = memo<AccountAddressesModalProps>(({ account, onClose }) => {
  const addresses = useMemo(
    () =>
      [TempleChainKind.Tezos, TempleChainKind.EVM]
        .map(chain => {
          const address = getAccountAddressForChain(account, chain);

          return address && { chain, address };
        })
        .filter(isTruthy),
    [account]
  );

  return (
    <ActionModal title="Edit Account Name" onClose={onClose}>
      <ActionModalBodyContainer className="gap-3">
        {addresses.map(({ chain, address }) => (
          <CopyButton key={chain} text={address} className={addressesEntryClassName}>
            <span className={addressesEntryTextClassName}>{chain}</span>

            <span className={addressesEntryTextClassName}>
              <HashShortView hash={address} />
            </span>
          </CopyButton>
        ))}
      </ActionModalBodyContainer>
    </ActionModal>
  );
});
