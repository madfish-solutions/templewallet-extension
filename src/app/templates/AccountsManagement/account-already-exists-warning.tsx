import React, { memo, useMemo } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { t } from 'lib/i18n';
import { DisplayedGroup, StoredAccount } from 'lib/temple/types';
import { useHDGroups } from 'temple/front';
import { getAllGroups } from 'temple/front/get-all-groups';

interface AccountAlreadyExistsWarningProps {
  newAccountGroup: DisplayedGroup;
  oldAccount: StoredAccount;
  onClose: () => void;
}

export const AccountAlreadyExistsWarning = memo<AccountAlreadyExistsWarningProps>(
  ({ newAccountGroup, oldAccount, onClose }) => {
    const hdGroups = useHDGroups();
    const oldAccountGroupName = useMemo(() => getAllGroups(hdGroups, [oldAccount])[0].name, [hdGroups, oldAccount]);

    return (
      <ActionModal title={t('addAccount')} onClose={onClose}>
        <ActionModalBodyContainer>
          <span className="w-full text-center text-xs leading-4 text-gray-600">
            {t('accountAlreadyExistsWarning', [newAccountGroup.name, oldAccountGroupName])}
          </span>
        </ActionModalBodyContainer>
        <ActionModalButtonsContainer>
          <ActionModalButton className="bg-orange-20 text-white" type="button" onClick={onClose}>
            Got it
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </ActionModal>
    );
  }
);
