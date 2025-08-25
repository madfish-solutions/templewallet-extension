import React, { memo, useMemo } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T } from 'lib/i18n';
import { DisplayedGroup, StoredAccount } from 'lib/temple/types';
import { useHDGroups } from 'temple/front';
import { getAllGroups } from 'temple/front/accounts-groups';

import { AccountManagementSelectors } from './selectors';

interface AccountAlreadyExistsWarningProps {
  newAccountGroup: DisplayedGroup;
  oldAccount: StoredAccount;
  onClose: EmptyFn;
}

export const AccountAlreadyExistsWarning = memo<AccountAlreadyExistsWarningProps>(
  ({ newAccountGroup, oldAccount, onClose }) => {
    const hdGroups = useHDGroups();
    const oldAccountGroupName = useMemo(() => getAllGroups(hdGroups, [oldAccount])[0].name, [hdGroups, oldAccount]);

    return (
      <ActionModal title={<T id="addAccount" />} hasCloseButton={false} onClose={onClose}>
        <ActionModalBodyContainer>
          <span className="w-full text-center text-font-description text-grey-1">
            <T id="accountAlreadyExistsWarning" substitutions={[newAccountGroup.name, oldAccountGroupName]} />
          </span>
        </ActionModalBodyContainer>
        <ActionModalButtonsContainer>
          <ActionModalButton
            color="primary"
            type="button"
            onClick={onClose}
            testID={AccountManagementSelectors.gotItButton}
          >
            <T id="okGotIt" />
          </ActionModalButton>
        </ActionModalButtonsContainer>
      </ActionModal>
    );
  }
);
