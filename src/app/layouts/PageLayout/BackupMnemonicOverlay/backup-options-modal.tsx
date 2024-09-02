import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ActionModal } from 'app/atoms/action-modal';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as DocumentsIcon } from 'app/icons/base/documents.svg';
import { ReactComponent as GoogleDriveIcon } from 'app/icons/base/google_drive.svg';
import { t } from 'lib/i18n';

import { BackupOptionsModalSelectors } from './selectors';

interface BackupOptionsModalProps {
  onSelect: EmptyFn;
}

export const BackupOptionsModal = memo<BackupOptionsModalProps>(({ onSelect }) => (
  <ActionModal title={t('backupYourWallet')} closable={false}>
    <div className="w-full flex flex-col items-center px-3 pt-2.5 pb-6 gap-3">
      <p className="py-1 text-font-description text-grey-1 text-center">{t('backupWalletDescription')}</p>

      <SocialButton className="w-full" testID={BackupOptionsModalSelectors.useGoogleDriveButton}>
        <GoogleDriveIcon className="h-8 w-auto" />
        <span className="text-font-regular-bold">{t('useGoogleDrive')}</span>
      </SocialButton>

      <StyledButton
        className="w-full flex justify-center gap-0.5"
        size="L"
        color="primary"
        onClick={onSelect}
        testID={BackupOptionsModalSelectors.manualBackupButton}
      >
        <IconBase Icon={DocumentsIcon} size={16} />
        <span className="text-font-regular-bold">{t('backupManually')}</span>
      </StyledButton>
    </div>
  </ActionModal>
));