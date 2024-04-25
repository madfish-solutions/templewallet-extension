import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { useAllAccountsReactiveOnAddition, useAllAccountsReactiveOnRemoval } from 'app/hooks/use-all-accounts-reactive';
import { t } from 'lib/i18n';
import { DisplayedGroup } from 'lib/temple/types';
import { searchAndFilterAccounts } from 'temple/front/accounts';
import { useAccountsGroups } from 'temple/front/groups';

import SearchField from '../SearchField';

import { DeleteWalletModal } from './delete-wallet-modal';
import { GroupView } from './group-view';
import { NewWalletActionsPopper } from './new-wallet-actions-popper';
import { RenameWalletModal } from './rename-wallet-modal';
import { RevealSeedPhraseModal } from './reveal-seed-phrase-modal';

enum AccountsManagementModal {
  RenameWallet = 'rename-wallet',
  RevealSeedPhrase = 'reveal-seed-phrase',
  DeleteWallet = 'delete-wallet'
}

export const AccountsManagement = memo(() => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<DisplayedGroup | null>(null);
  const [activeModal, setActiveModal] = useState<AccountsManagementModal | null>(null);

  const allAccounts = useAllAccountsReactiveOnAddition();
  useAllAccountsReactiveOnRemoval();

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
    setSelectedGroup(null);
  }, []);

  const actionWithModalFactory = useCallback(
    (modal: AccountsManagementModal) => (group: DisplayedGroup) => {
      setSelectedGroup(group);
      setActiveModal(modal);
    },
    []
  );
  const handleDeleteClick = useMemo(
    () => actionWithModalFactory(AccountsManagementModal.DeleteWallet),
    [actionWithModalFactory]
  );
  const handleRenameClick = useMemo(
    () => actionWithModalFactory(AccountsManagementModal.RenameWallet),
    [actionWithModalFactory]
  );
  const handleRevealSeedPhraseClick = useMemo(
    () => actionWithModalFactory(AccountsManagementModal.RevealSeedPhrase),
    [actionWithModalFactory]
  );

  const modal = useMemo(() => {
    switch (activeModal) {
      case AccountsManagementModal.RenameWallet:
        return <RenameWalletModal onClose={handleModalClose} selectedGroup={selectedGroup!} />;
      case AccountsManagementModal.RevealSeedPhrase:
        return <RevealSeedPhraseModal selectedGroup={selectedGroup!} onClose={handleModalClose} />;
      case AccountsManagementModal.DeleteWallet:
        return <DeleteWalletModal selectedGroup={selectedGroup!} onClose={handleModalClose} />;
      default:
        return null;
    }
  }, [activeModal, handleModalClose, selectedGroup]);

  return (
    <div className="w-full flex justify-center">
      <div className="w-full flex flex-col max-w-sm">
        <div className="flex flex-row py-4 gap-4 w-full items-center">
          <SearchField
            value={searchValue}
            className={clsx(
              'bg-gray-200 focus:outline-none transition ease-in-out duration-200',
              'text-gray-900 placeholder-gray-600 text-xs leading-tight rounded-lg'
            )}
            placeholder={t('searchAccount', '')}
            searchIconClassName="h-3 w-auto text-gray-600 stroke-current"
            searchIconWrapperClassName="pl-3 pr-0.5"
            cleanButtonIconClassName="text-gray-200 w-auto stroke-current stroke-2"
            cleanButtonStyle={{ backgroundColor: '#AEAEB2', borderWidth: 0 }}
            onValueChange={setSearchValue}
          />
          <NewWalletActionsPopper />
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto w-full">
          {filteredGroups.map(group => (
            <GroupView
              group={group}
              key={group.id}
              onDeleteClick={handleDeleteClick}
              onRenameClick={handleRenameClick}
              onRevealSeedPhraseClick={handleRevealSeedPhraseClick}
              searchValue={searchValue}
            />
          ))}
        </div>
        {modal}
      </div>
    </div>
  );
});
