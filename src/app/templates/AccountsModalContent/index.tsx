import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { EmptyState } from 'app/atoms/EmptyState';
import { IconButton } from 'app/atoms/IconButton';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as SettingsIcon } from 'app/icons/base/settings.svg';
import {
  AccountsGroup as GenericAccountsGroup,
  AccountsGroupProps as GenericAccountsGroupProps
} from 'app/templates/AccountsGroup';
import { NewWalletActionsPopper } from 'app/templates/NewWalletActionsPopper';
import { SearchBarField } from 'app/templates/SearchField';
import { searchHotkey } from 'lib/constants';
import { t } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { navigate } from 'lib/woozie';
import { searchAndFilterAccounts, useAccountsGroups, useCurrentAccountId, useVisibleAccounts } from 'temple/front';
import { useSetAccountId } from 'temple/front/ready';

import { AccountCard, AccountCardProps } from '../AccountCard';
import { ConnectLedgerModal } from '../connect-ledger-modal';
import { CreateHDWalletModal } from '../CreateHDWalletModal';
import { ImportAccountModal, ImportOptionSlug } from '../ImportAccountModal';

import { AccountsModalSelectors } from './selectors';

export interface AccountsModalContentProps {
  accounts?: StoredAccount[];
  currentAccountId?: string;
  opened: boolean;
  onRequestClose: EmptyFn;
}

enum AccountsModalSubmodals {
  CreateHDWallet = 'create-hd-wallet',
  ImportAccount = 'import-account',
  WatchOnly = 'watch-only',
  ConnectLedger = 'connect-ledger'
}

export const AccountsModalContent = memo<AccountsModalContentProps>(
  ({ accounts: specifiedAccounts, currentAccountId: specifiedCurrentAccountId, opened, onRequestClose }) => {
    const allAccounts = useVisibleAccounts();
    const globalCurrentAccountId = useCurrentAccountId();
    const currentAccountId = specifiedCurrentAccountId ?? globalCurrentAccountId;
    const accounts = specifiedAccounts ?? allAccounts;

    const [searchValue, setSearchValue] = useState('');
    const [topEdgeIsVisible, setTopEdgeIsVisible] = useState(true);
    const [activeSubmodal, setActiveSubmodal] = useState<AccountsModalSubmodals | undefined>(undefined);
    const [importOptionSlug, setImportOptionSlug] = useState<ImportOptionSlug | undefined>();

    useAllAccountsReactiveOnAddition();
    useShortcutAccountSelectModalIsOpened(onRequestClose);

    const filteredAccounts = useMemo(
      () => (searchValue.length ? searchAndFilterAccounts(accounts, searchValue) : accounts),
      [searchValue, accounts]
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
    const goToConnectLedgerModal = useCallback(() => setActiveSubmodal(AccountsModalSubmodals.ConnectLedger), []);
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
        case AccountsModalSubmodals.ConnectLedger:
          return (
            <ConnectLedgerModal
              animated={false}
              shouldShowBackButton
              onStartGoBack={closeSubmodal}
              onClose={totalClose}
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

        <div
          className={clsx(
            'flex gap-x-2 p-4',
            !topEdgeIsVisible && 'shadow-bottom border-b-0.5 border-lines overflow-y-visible'
          )}
        >
          <SearchBarField
            placeholder={t('searchAccount', [searchHotkey])}
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
            goToConnectLedgerModal={goToConnectLedgerModal}
          />
        </div>

        <ScrollView onTopEdgeVisibilityChange={setTopEdgeIsVisible} topEdgeThreshold={4}>
          {filteredGroups.length === 0 ? (
            <div className="w-full h-full flex items-center">
              <EmptyState />
            </div>
          ) : (
            filteredGroups.map(group => (
              <AccountsGroup
                key={group.id}
                title={group.name}
                accounts={group.accounts}
                currentAccountId={currentAccountId}
                attractSelectedAccount={attractSelectedAccount}
                searchValue={searchValue}
                onAccountSelect={onRequestClose}
              />
            ))
          )}
        </ScrollView>
      </>
    );
  }
);

interface AccountsGroupProps extends Omit<GenericAccountsGroupProps, 'children'> {
  currentAccountId: string;
  attractSelectedAccount: boolean;
  searchValue: string;
  onAccountSelect: EmptyFn;
}

const AccountsGroup = memo<AccountsGroupProps>(
  ({ title, accounts, currentAccountId, attractSelectedAccount, searchValue, onAccountSelect }) => (
    <GenericAccountsGroup title={title} accounts={accounts}>
      {account => (
        <AccountOfGroup
          key={account.id}
          account={account}
          isCurrent={account.id === currentAccountId}
          attractSelf={attractSelectedAccount}
          searchValue={searchValue}
          onClick={onAccountSelect}
        />
      )}
    </GenericAccountsGroup>
  )
);

const AccountOfGroup = memo<AccountCardProps>(({ onClick, isCurrent, account, ...restProps }) => {
  const setAccountId = useSetAccountId();

  const handleClick = useCallback(() => {
    if (isCurrent) return;

    setAccountId(account.id);
    onClick?.();
  }, [isCurrent, account.id, onClick, setAccountId]);

  return <AccountCard {...restProps} account={account} isCurrent={isCurrent} onClick={handleClick} />;
});
