import React, { FC, memo, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ReactComponent as EditIcon } from 'app/icons/base/edit.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as MenuCircleIcon } from 'app/icons/base/menu_circle.svg';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import { ReactComponent as RevealEyeIcon } from 'app/icons/base/reveal.svg';
import { ACCOUNT_EXISTS_SHOWN_WARNINGS_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { DisplayedGroup, StoredAccount, TempleAccountType } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { isTruthy } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { useHDGroups } from 'temple/front';

import { AccountsAction, AccountsActionsDropdown } from './actions-dropdown';
import { AccountsManagementSelectors } from './selectors';

export interface GroupActionsPopperProps {
  group: DisplayedGroup;
  onRenameClick: (group: DisplayedGroup) => void;
  onRevealSeedPhraseClick: (group: DisplayedGroup) => void;
  onDeleteClick: (group: DisplayedGroup) => void;
  showAccountAlreadyExistsWarning: (group: DisplayedGroup, oldAccount: StoredAccount) => void;
}

const GroupActionsDropdown = memo<PopperRenderProps & GroupActionsPopperProps>(
  ({
    group,
    opened,
    setOpened,
    toggleOpened,
    onRenameClick,
    onRevealSeedPhraseClick,
    onDeleteClick,
    showAccountAlreadyExistsWarning
  }) => {
    const { createAccount, findFreeHdIndex } = useTempleClient();
    const hdGroups = useHDGroups();
    const customAlert = useAlert();
    const [accountExistsShownWarnings, setAccountExistsShownWarnings] = useStorage<Record<string, boolean>>(
      ACCOUNT_EXISTS_SHOWN_WARNINGS_STORAGE_KEY,
      {}
    );

    const actions = useMemo<AccountsAction[]>(() => {
      if (group.type === TempleAccountType.HD) {
        return [
          {
            key: 'add-account',
            children: t('addAccount'),
            Icon: AddIcon,
            onClick: async () => {
              try {
                const { firstSkippedAccount } = await findFreeHdIndex(group.id);
                if (firstSkippedAccount && !accountExistsShownWarnings[group.id]) {
                  showAccountAlreadyExistsWarning(group, firstSkippedAccount);
                  setAccountExistsShownWarnings(prevState => ({
                    ...Object.fromEntries(
                      Object.entries(prevState).filter(([groupId]) => !hdGroups.some(({ id }) => id === groupId))
                    ),
                    [group.id]: true
                  }));
                } else {
                  await createAccount(group.id);
                }
              } catch (e: any) {
                console.error(e);
                customAlert({
                  title: 'Failed to create an account',
                  description: e.message
                });
              }
            },
            testID: AccountsManagementSelectors.addGroupAccount
          },
          {
            key: 'rename-wallet',
            children: t('renameWallet'),
            Icon: EditIcon,
            onClick: () => onRenameClick(group),
            testID: AccountsManagementSelectors.renameWallet
          },
          {
            key: 'reveal-seed-phrase',
            children: t('revealSeedPhrase'),
            Icon: RevealEyeIcon,
            onClick: () => onRevealSeedPhraseClick(group),
            testID: AccountsManagementSelectors.revealSeedPhrase
          },
          hdGroups.length > 1 && {
            key: 'delete-wallet',
            children: t('deleteWallet'),
            className: 'text-error',
            Icon: DeleteIcon,
            danger: true,
            onClick: () => onDeleteClick(group),
            testID: AccountsManagementSelectors.deleteWallet
          }
        ].filter(isTruthy);
      }

      if (group.type === TempleAccountType.ManagedKT) {
        return [
          {
            key: 'delete-group',
            children: t('delete'),
            className: 'text-error',
            Icon: DeleteIcon,
            danger: true,
            onClick: () => onDeleteClick(group),
            testID: AccountsManagementSelectors.deleteGroup
          }
        ];
      }

      let importActionUrl;
      switch (group.type) {
        case TempleAccountType.Imported:
          importActionUrl = '/import-account/private-key';
          break;
        case TempleAccountType.Ledger:
          importActionUrl = '/connect-ledger';
          break;
        default:
          importActionUrl = '/import-account/watch-only';
      }

      return [
        {
          key: 'import',
          children: t(group.type === TempleAccountType.Imported ? 'importAccount' : 'createAccount'),
          Icon: ImportedIcon,
          onClick: () => navigate(importActionUrl),
          testID: AccountsManagementSelectors.importAccount
        },
        {
          key: 'delete-group',
          children: t('delete'),
          className: 'text-error',
          Icon: DeleteIcon,
          danger: true,
          onClick: () => onDeleteClick(group),
          testID: AccountsManagementSelectors.deleteGroup
        }
      ];
    }, [
      group,
      hdGroups,
      findFreeHdIndex,
      accountExistsShownWarnings,
      showAccountAlreadyExistsWarning,
      setAccountExistsShownWarnings,
      createAccount,
      customAlert,
      onRenameClick,
      onRevealSeedPhraseClick,
      onDeleteClick
    ]);

    return (
      <AccountsActionsDropdown
        opened={opened}
        setOpened={setOpened}
        toggleOpened={toggleOpened}
        title={group.type === TempleAccountType.HD ? 'Wallet Actions' : 'Actions'}
        actions={actions}
      />
    );
  }
);

export const GroupActionsPopper: FC<GroupActionsPopperProps> = ({ group, ...restPopperProps }) => (
  <Popper
    placement="bottom-end"
    strategy="fixed"
    popup={props => <GroupActionsDropdown group={group} {...restPopperProps} {...props} />}
  >
    {({ ref, toggleOpened }) => (
      <Button
        ref={ref}
        onClick={toggleOpened}
        testID={AccountsManagementSelectors.groupActionsButton}
        testIDProperties={{ groupType: group.type }}
      >
        <IconBase Icon={MenuCircleIcon} size={16} className="text-secondary" />
      </Button>
    )}
  </Popper>
);
