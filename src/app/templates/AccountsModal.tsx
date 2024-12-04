import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';

import { AccountsModalContent, AccountsModalContentProps } from './AccountsModalContent';

export const AccountsModal = memo<AccountsModalContentProps>(
  ({ accounts, currentAccountId, opened, onRequestClose }) => (
    <PageModal title={t('myAccounts')} opened={opened} onRequestClose={onRequestClose}>
      <AccountsModalContent
        accounts={accounts}
        currentAccountId={currentAccountId}
        opened={opened}
        onRequestClose={onRequestClose}
      />
    </PageModal>
  )
);
