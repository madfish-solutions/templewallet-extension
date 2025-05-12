import React, { memo } from 'react';

import { Alert } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { t } from 'lib/i18n';

interface DeleteBackupModalProps {
  onCancel: EmptyFn;
  onDelete: EmptyFn;
}

export const DeleteBackupModal = memo<DeleteBackupModalProps>(({ onCancel, onDelete }) => (
  <ActionModal title={t('deleteExistingBackupQuestion')}>
    <ActionModalBodyContainer className="pt-3 pb-1 gap-3">
      <Alert description={t('deleteBackupWarning')} type="warning" />
      <p className="text-font-description text-center text-grey-1">{t('deleteBackupDescription')}</p>
    </ActionModalBodyContainer>
    <ActionModalButtonsContainer>
      <ActionModalButton color="primary-low" onClick={onCancel} type="button">
        {t('cancel')}
      </ActionModalButton>
      <ActionModalButton color="red" onClick={onDelete} type="button">
        {t('delete')}
      </ActionModalButton>
    </ActionModalButtonsContainer>
  </ActionModal>
));
