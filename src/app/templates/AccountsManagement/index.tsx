import React, { memo, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { useAllAccountsReactiveOnAddition, useAllAccountsReactiveOnRemoval } from 'app/hooks/use-all-accounts-reactive';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { DisplayedGroup, StoredAccount } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import { searchAndFilterAccounts } from 'temple/front/accounts';
import { useAccountsGroups } from 'temple/front/groups';

import SearchField from '../SearchField';

import { AccountAlreadyExistsWarning } from './account-already-exists-warning';
import { DeleteWalletModal } from './delete-wallet-modal';
import { GroupView } from './group-view';
import { NewWalletActionsPopper } from './new-wallet-actions-popper';
import { RenameWalletModal } from './rename-wallet-modal';
import { RevealSeedPhraseModal } from './reveal-seed-phrase-modal';

enum AccountsManagementModal {
  RenameWallet = 'rename-wallet',
  RevealSeedPhrase = 'reveal-seed-phrase',
  DeleteWallet = 'delete-wallet',
  AccountAlreadyExistsWarning = 'account-already-exists-warning'
}

export const AccountsManagement = memo(() => {
  const { createAccount } = useTempleClient();
  const customAlert = useAlert();
  const allAccounts = useAllAccountsReactiveOnAddition();
  useAllAccountsReactiveOnRemoval();

  const [searchValue, setSearchValue] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<DisplayedGroup | null>(null);
  const [activeModal, setActiveModal] = useState<AccountsManagementModal | null>(null);
  const [oldAccount, setOldAccount] = useState<StoredAccount | null>(null);

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

  const handleModalClose = useCallback(() => {
    setActiveModal(null);
    setSelectedGroup(null);
    setOldAccount(null);
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

  const showAccountAlreadyExistsWarning = useCallback((group: DisplayedGroup, oldAccount: StoredAccount) => {
    setSelectedGroup(group);
    setOldAccount(oldAccount);
    setActiveModal(AccountsManagementModal.AccountAlreadyExistsWarning);
  }, []);

  const handleAccountAlreadyExistsWarnClose = useCallback(async () => {
    try {
      await createAccount(selectedGroup!.id);
    } catch (e: any) {
      console.error(e);
      customAlert({
        title: 'Failed to create an account',
        description: e.message
      });
    }
  }, [createAccount, customAlert, selectedGroup]);

  const modal = useMemo(() => {
    switch (activeModal) {
      case AccountsManagementModal.RenameWallet:
        return <RenameWalletModal onClose={handleModalClose} selectedGroup={selectedGroup!} />;
      case AccountsManagementModal.RevealSeedPhrase:
        return <RevealSeedPhraseModal selectedGroup={selectedGroup!} onClose={handleModalClose} />;
      case AccountsManagementModal.DeleteWallet:
        return <DeleteWalletModal selectedGroup={selectedGroup!} onClose={handleModalClose} />;
      case AccountsManagementModal.AccountAlreadyExistsWarning:
        return (
          <AccountAlreadyExistsWarning
            newAccountGroup={selectedGroup!}
            oldAccount={oldAccount!}
            onClose={handleAccountAlreadyExistsWarnClose}
          />
        );
      default:
        return null;
    }
  }, [activeModal, handleAccountAlreadyExistsWarnClose, handleModalClose, oldAccount, selectedGroup]);

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
              searchValue={searchValue}
              onDeleteClick={handleDeleteClick}
              onRenameClick={handleRenameClick}
              onRevealSeedPhraseClick={handleRevealSeedPhraseClick}
              showAccountAlreadyExistsWarning={showAccountAlreadyExistsWarning}
            />
          ))}
        </div>
        {modal}
      </div>
    </div>
  );
});
