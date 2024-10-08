import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Name } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName } from 'app/atoms/AccountName';
import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { RadioButton } from 'app/atoms/RadioButton';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as SettingsIcon } from 'app/icons/base/settings.svg';
import { NewWalletActionsPopper } from 'app/templates/NewWalletActionsPopper';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { navigate } from 'lib/woozie';
import { searchAndFilterAccounts, useAccountsGroups, useCurrentAccountId, useVisibleAccounts } from 'temple/front';
import { useSetAccountId } from 'temple/front/ready';

import { CreateHDWalletModal } from '../CreateHDWalletModal';
import { ImportAccountModal, ImportOptionSlug } from '../ImportAccountModal';

import { AccountsModalSelectors } from './selectors';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

enum AccountsModalSubmodals {
  CreateHDWallet = 'create-hd-wallet',
  ImportAccount = 'import-account',
  WatchOnly = 'watch-only'
}

export const AccountsModal = memo<Props>(({ opened, onRequestClose }) => {
  const allAccounts = useVisibleAccounts();
  const currentAccountId = useCurrentAccountId();

  const [searchValue, setSearchValue] = useState('');
  const [topEdgeIsVisible, setTopEdgeIsVisible] = useState(true);
  const [activeSubmodal, setActiveSubmodal] = useState<AccountsModalSubmodals | undefined>(undefined);
  const [importOptionSlug, setImportOptionSlug] = useState<ImportOptionSlug | undefined>();

  useAllAccountsReactiveOnAddition();
  useShortcutAccountSelectModalIsOpened(onRequestClose);

  const filteredAccounts = useMemo(
    () => (searchValue.length ? searchAndFilterAccounts(allAccounts, searchValue) : allAccounts),
    [searchValue, allAccounts]
  );
  const filteredGroups = useAccountsGroups(filteredAccounts);

  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (!opened) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  useEffect(() => {
    if (!opened) setSearchValue('');
  }, [opened]);

  const closeSubmodal = useCallback(() => {
    setActiveSubmodal(undefined);
    setImportOptionSlug(undefined);
  }, []);

  const totalClose = useCallback(() => {
    closeSubmodal();
    onRequestClose();
  }, [closeSubmodal, onRequestClose]);

  const startWalletCreation = useCallback(() => setActiveSubmodal(AccountsModalSubmodals.CreateHDWallet), []);

  const goToImportModal = useCallback(() => {
    setActiveSubmodal(AccountsModalSubmodals.ImportAccount);
    setImportOptionSlug(undefined);
  }, []);
  const goToWatchOnlyModal = useCallback(() => setActiveSubmodal(AccountsModalSubmodals.WatchOnly), []);
  const handleSeedPhraseImportOptionSelect = useCallback(() => setImportOptionSlug('mnemonic'), []);
  const handlePrivateKeyImportOptionSelect = useCallback(() => setImportOptionSlug('private-key'), []);

  const submodal = useMemo(() => {
    switch (activeSubmodal) {
      case AccountsModalSubmodals.CreateHDWallet:
        return (
          <CreateHDWalletModal
            animated={false}
            onSuccess={closeSubmodal}
            onClose={totalClose}
            onStartGoBack={closeSubmodal}
          />
        );
      case AccountsModalSubmodals.ImportAccount:
        return (
          <ImportAccountModal
            animated={false}
            optionSlug={importOptionSlug}
            shouldShowBackButton
            onGoBack={importOptionSlug ? goToImportModal : closeSubmodal}
            onRequestClose={totalClose}
            onSeedPhraseSelect={handleSeedPhraseImportOptionSelect}
            onPrivateKeySelect={handlePrivateKeyImportOptionSelect}
          />
        );
      case AccountsModalSubmodals.WatchOnly:
        return (
          <ImportAccountModal
            animated={false}
            optionSlug="watch-only"
            shouldShowBackButton
            onGoBack={closeSubmodal}
            onRequestClose={totalClose}
          />
        );
      default:
        return null;
    }
  }, [
    activeSubmodal,
    closeSubmodal,
    goToImportModal,
    handlePrivateKeyImportOptionSelect,
    handleSeedPhraseImportOptionSelect,
    importOptionSlug,
    totalClose
  ]);

  return (
    <>
      {submodal}

      <PageModal title={t('myAccounts')} opened={opened} onRequestClose={onRequestClose}>
        <div
          className={clsx(
            'flex gap-x-2 p-4',
            !topEdgeIsVisible && 'shadow-bottom border-b-0.5 border-lines overflow-y-visible'
          )}
        >
          <SearchBarField
            value={searchValue}
            onValueChange={setSearchValue}
            testID={AccountsModalSelectors.searchField}
          />

          <IconButton
            Icon={SettingsIcon}
            color="blue"
            onClick={() => navigate('settings/accounts-management')}
            testID={AccountsModalSelectors.accountsManagementButton}
          />

          <NewWalletActionsPopper
            startWalletCreation={startWalletCreation}
            testID={AccountsModalSelectors.newWalletActionsButton}
            goToImportModal={goToImportModal}
            goToWatchOnlyModal={goToWatchOnlyModal}
          />
        </div>

        <ScrollView onTopEdgeVisibilityChange={setTopEdgeIsVisible} topEdgeThreshold={4}>
          {filteredGroups.length === 0 ? (
            <div className="w-full h-full flex items-center">
              <EmptyState variant="searchUniversal" />
            </div>
          ) : (
            filteredGroups.map(group => (
              <AccountsGroup
                key={group.id}
                title={group.name}
                accounts={group.accounts}
                currentAccountId={currentAccountId}
                searchValue={searchValue}
                attractSelectedAccount={attractSelectedAccount}
                onAccountSelect={onRequestClose}
              />
            ))
          )}
        </ScrollView>
      </PageModal>
    </>
  );
});

interface AccountsGroupProps {
  title: string;
  accounts: StoredAccount[];
  currentAccountId: string;
  searchValue: string;
  attractSelectedAccount: boolean;
  onAccountSelect: EmptyFn;
}

const AccountsGroup = memo<AccountsGroupProps>(
  ({ title, accounts, currentAccountId, searchValue, attractSelectedAccount, onAccountSelect }) => {
    //
    return (
      <div className="flex flex-col mb-4">
        <Name className="mb-1 p-1 text-font-description-bold">{title}</Name>

        <div className="flex flex-col gap-y-3">
          {accounts.map(account => (
            <AccountOfGroup
              key={account.id}
              account={account}
              isCurrent={account.id === currentAccountId}
              searchValue={searchValue}
              attractSelf={attractSelectedAccount}
              onSelect={onAccountSelect}
            />
          ))}
        </div>
      </div>
    );
  }
);

interface AccountOfGroupProps {
  account: StoredAccount;
  isCurrent: boolean;
  searchValue: string;
  attractSelf: boolean;
  onSelect: EmptyFn;
}

const AccountOfGroup = memo<AccountOfGroupProps>(({ account, isCurrent, searchValue, attractSelf, onSelect }) => {
  const setAccountId = useSetAccountId();

  const onClick = useCallback(() => {
    if (isCurrent) return;

    setAccountId(account.id);
    onSelect();
  }, [isCurrent, account.id, onSelect, setAccountId]);

  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(isCurrent && attractSelf);

  return (
    <div
      ref={elemRef}
      className={clsx(
        'flex flex-col p-2 gap-y-1.5',
        'rounded-lg shadow-bottom border',
        isCurrent ? 'border-primary' : 'cursor-pointer group border-transparent hover:border-lines'
      )}
      onClick={onClick}
    >
      <div className="flex gap-x-1">
        <AccountAvatar seed={account.id} size={32} borderColor="gray" />

        <AccountName account={account} searchValue={searchValue} smaller />

        <div className="flex-1" />

        <RadioButton active={isCurrent} className={isCurrent ? undefined : 'opacity-0 group-hover:opacity-100'} />
      </div>

      <div className="flex items-center">
        <div className="flex-1 flex flex-col">
          <div className="text-font-small text-grey-1">Total Balance:</div>

          <div className="text-font-num-14">
            <TotalEquity account={account} currency="fiat" />
          </div>
        </div>

        <AccLabel type={account.type} />
      </div>
    </div>
  );
});
