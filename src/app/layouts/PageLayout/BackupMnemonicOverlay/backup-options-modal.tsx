import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ActionModal } from 'app/atoms/action-modal';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as DocumentsIcon } from 'app/icons/base/documents.svg';
import { ReactComponent as GoogleDriveIcon } from 'app/icons/base/google_drive.svg';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { FeedbackModal } from '../FeedbackModal';

import { BackupOptionsModalSelectors } from './selectors';

interface BackupOptionsModalProps {
  onSelect: EmptyFn;
}

export const BackupOptionsModal = memo<BackupOptionsModalProps>(({ onSelect }) => {
  const [isFeedbackModalOpen, setFeedbackModalOpened, setFeedbackModalClosed] = useBooleanState(false);

  return (
    <>
      <ActionModal title={t('secureYourWallet')} hasCloseButton={false}>
        <div className="w-full flex flex-col items-center px-3 pt-2.5 pb-6 gap-3">
          <p className="py-1 text-font-description text-grey-1 text-center">{t('backupWalletDescription')}</p>

          <SocialButton
            className="w-full"
            onClick={setFeedbackModalOpened}
            testID={BackupOptionsModalSelectors.useGoogleDriveButton}
          >
            <GoogleDriveIcon className="h-8 w-auto" />
            <span className="text-font-regular-bold">{t('backupToGoogle')}</span>
          </SocialButton>

          <StyledButton
            className="w-full flex justify-center gap-0.5"
            size="L"
            color="primary"
            onClick={onSelect}
            testID={BackupOptionsModalSelectors.manualBackupButton}
          >
            <IconBase Icon={DocumentsIcon} className="text-white" />
            <span className="text-font-regular-bold">{t('backupManually')}</span>
          </StyledButton>
        </div>
      </ActionModal>

      {isFeedbackModalOpen && <FeedbackModal isGoogleSyncFeature onClose={setFeedbackModalClosed} />}
    </>
  );
});
