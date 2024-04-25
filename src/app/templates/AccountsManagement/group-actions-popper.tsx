import React, { FC, memo, useMemo } from 'react';

import { Button } from 'app/atoms';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as EditIcon } from 'app/icons/edit.svg';
import { ReactComponent as EllipsisIcon } from 'app/icons/ellypsis.svg';
import { ReactComponent as RemoveIcon } from 'app/icons/remove.svg';
import { ReactComponent as RevealEyeIcon } from 'app/icons/reveal-eye.svg';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { fetchNewAccountName } from 'lib/temple/helpers';
import { DisplayedGroup, TempleAccountType } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { isTruthy } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { useAllAccounts, useAllGroups } from 'temple/front';

import { Action, ActionsDropdown } from './actions-dropdown';

export interface GroupActionsPopperProps {
  group: DisplayedGroup;
  onRenameClick: (group: DisplayedGroup) => void;
  onRevealSeedPhraseClick: (group: DisplayedGroup) => void;
  onDeleteClick: (group: DisplayedGroup) => void;
}

const actionsDropdownStyle = { transform: 'translate(1.25rem, 1rem)' };

const GroupActionsDropdown = memo<PopperRenderProps & GroupActionsPopperProps>(
  ({ group, opened, setOpened, toggleOpened, onRenameClick, onRevealSeedPhraseClick, onDeleteClick }) => {
    const { createAccount } = useTempleClient();
    const allAccounts = useAllAccounts();
    const allGroups = useAllGroups();
    const customAlert = useAlert();

    const actions = useMemo<Action[]>(() => {
      const hdGroupsCount = allGroups.filter(g => g.type === TempleAccountType.HD).length;

      if (group.type === TempleAccountType.HD) {
        return [
          {
            key: 'add-account',
            i18nKey: 'createAccount' as const,
            icon: AddIcon,
            onClick: async () => {
              try {
                const name = await fetchNewAccountName(
                  allAccounts,
                  TempleAccountType.HD,
                  i => t('defaultAccountName', String(i)),
                  group.id
                );
                await createAccount(group.id, name);
              } catch (e: any) {
                console.error(e);
                customAlert({
                  title: 'Failed to create an account',
                  description: e.message
                });
              }
            },
            danger: false
          },
          {
            key: 'rename-wallet',
            i18nKey: 'edit' as const,
            icon: EditIcon,
            onClick: async () => onRenameClick(group),
            danger: false
          },
          {
            key: 'reveal-seed-phrase',
            i18nKey: 'revealSeedPhrase' as const,
            icon: RevealEyeIcon,
            onClick: () => onRevealSeedPhraseClick(group),
            danger: false
          },
          hdGroupsCount > 1 && {
            key: 'delete-wallet',
            i18nKey: 'delete' as const,
            icon: RemoveIcon,
            onClick: () => onDeleteClick(group),
            danger: true
          }
        ].filter(isTruthy);
      }

      let importActionUrl;
      switch (group.type) {
        case TempleAccountType.Imported:
          importActionUrl = '/import-account/private-key';
          break;
        case TempleAccountType.Ledger:
          importActionUrl = '/connect-ledger';
          break;
        case TempleAccountType.ManagedKT:
          importActionUrl = '/import-account/managed-kt';
          break;
        default:
          importActionUrl = '/import-account/watch-only';
      }

      return [
        {
          key: 'import',
          i18nKey: group.type === TempleAccountType.Imported ? 'importAccount' : 'createAccount',
          icon: DownloadIcon,
          onClick: () => navigate(importActionUrl),
          danger: false
        },
        {
          key: 'delete-group',
          i18nKey: 'delete' as const,
          icon: RemoveIcon,
          onClick: () => onDeleteClick(group),
          danger: true
        }
      ];
    }, [
      allGroups,
      group,
      allAccounts,
      createAccount,
      customAlert,
      onRenameClick,
      onRevealSeedPhraseClick,
      onDeleteClick
    ]);

    return (
      <ActionsDropdown
        opened={opened}
        setOpened={setOpened}
        toggleOpened={toggleOpened}
        title={group.type === TempleAccountType.HD ? 'Wallet Actions' : 'Actions'}
        actions={actions}
        style={actionsDropdownStyle}
      />
    );
  }
);

export const GroupActionsPopper: FC<GroupActionsPopperProps> = ({ group, ...restPopperProps }) => (
  <Popper
    placement="left-start"
    strategy="fixed"
    style={{ pointerEvents: 'none' }}
    popup={props => <GroupActionsDropdown group={group} {...restPopperProps} {...props} />}
  >
    {({ ref, toggleOpened }) => (
      <Button
        ref={ref}
        onClick={toggleOpened}
        className="border border-blue-500 rounded-full text-blue-500 w-4 h-4 flex justify-center items-center m-1"
      >
        <EllipsisIcon className="w-3 h-3 stroke-current" />
      </Button>
    )}
  </Popper>
);
