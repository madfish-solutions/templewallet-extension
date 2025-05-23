import React, { memo } from 'react';

import { Alert } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { t } from 'lib/i18n';

interface ForgotPasswordModalProps {
  onClose: EmptyFn;
  onContinueClick: EmptyFn;
}

export const ForgotPasswordModal = memo<ForgotPasswordModalProps>(({ onClose, onContinueClick }) => (
  <ActionModal title={t('forgotPasswordModalTitle')} onClose={onClose}>
    <ActionModalBodyContainer className="pt-3 pb-1 gap-3">
      <Alert description={t('backupPasswordHint')} type="info" />
      <p className="text-font-description text-center text-grey-1">{t('forgotBackupPasswordDescription')}</p>
    </ActionModalBodyContainer>
    <ActionModalButtonsContainer>
      <ActionModalButton color="primary" onClick={onContinueClick} type="button">
        {t('continue')}
      </ActionModalButton>
    </ActionModalButtonsContainer>
  </ActionModal>
));
