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
import { useAllAccounts, useAllGroups } from 'lib/temple/front/ready';
import { fetchNewAccountName } from 'lib/temple/helpers';
import { DisplayedGroup, TempleAccountType } from 'lib/temple/types';
import { useAlert } from 'lib/ui';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { isTruthy } from 'lib/utils';
import { navigate } from 'lib/woozie';

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

      switch (group.type) {
        case TempleAccountType.HD:
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
              onClick: async () => {
                // setOpened(false);
                onRenameClick(group);
              },
              danger: false
            },
            {
              key: 'reveal-seed-phrase',
              i18nKey: 'revealSeedPhrase' as const,
              icon: RevealEyeIcon,
              onClick: () => {
                // setOpened(false);
                onRevealSeedPhraseClick(group);
              },
              danger: false
            },
            hdGroupsCount > 1 && {
              key: 'delete-wallet',
              i18nKey: 'delete' as const,
              icon: RemoveIcon,
              onClick: () => {
                // setOpened(false);
                onDeleteClick(group);
              },
              danger: true
            }
          ].filter(isTruthy);
        case TempleAccountType.Imported:
          return [
            {
              key: 'import-new',
              i18nKey: 'importAccount' as const,
              icon: DownloadIcon,
              onClick: () => navigate(`/import-account?accountType=${TempleAccountType.Imported}`),
              danger: false
            },
            {
              key: 'delete-group',
              i18nKey: 'delete' as const,
              icon: RemoveIcon,
              onClick: () => {
                onDeleteClick(group);
              },
              danger: true
            }
          ];
        default:
          return [
            {
              key: 'add-account',
              i18nKey: 'createAccount' as const,
              icon: AddIcon,
              onClick: () =>
                navigate(
                  group.type === TempleAccountType.Ledger
                    ? '/connect-ledger'
                    : `/import-account?accountType=${group.type}`
                ),
              danger: false
            },
            {
              key: 'delete-wallet',
              i18nKey: 'delete' as const,
              icon: RemoveIcon,
              onClick: () => {
                onDeleteClick(group);
              },
              danger: true
            }
          ];
      }
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
