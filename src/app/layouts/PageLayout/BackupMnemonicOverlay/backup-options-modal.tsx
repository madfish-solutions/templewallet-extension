import React, { memo } from 'react';

import { ActionModal } from 'app/atoms/action-modal';
import { t } from 'lib/i18n';

import { BackupOptionByType, BackupOptionByTypeProps, BackupOptionType, IllustrationName } from './backup-option';
import { BackupMnemonicOverlaySelectors } from './selectors';

interface BackupOptionsModalProps {
  onSelect: SyncFn<BackupOptionType>;
}

const optionsProps: Omit<BackupOptionByTypeProps, 'onClick'>[] = [
  {
    type: 'google-drive',
    titleI18nKey: 'backupToGoogle',
    descriptionI18nKey: 'backupToGoogleDescription',
    testID: BackupMnemonicOverlaySelectors.useGoogleDriveButton,
    illustrationName: IllustrationName.GoogleDriveBackup
  },
  {
    type: 'manual',
    titleI18nKey: 'manualBackup',
    descriptionI18nKey: 'manualBackupDescription',
    testID: BackupMnemonicOverlaySelectors.manualBackupButton,
    illustrationName: IllustrationName.ManualBackup
  }
];

export const BackupOptionsModal = memo<BackupOptionsModalProps>(({ onSelect }) => (
  <ActionModal title={t('secureYourWallet')} hasCloseButton={false}>
    <div className="w-full flex flex-col px-3 py-4 gap-2">
      {optionsProps.map(({ type, ...restProps }) => (
        <BackupOptionByType key={type} type={type} onClick={onSelect} {...restProps} />
      ))}
    </div>
  </ActionModal>
));
