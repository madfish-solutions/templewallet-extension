import React, { memo, useCallback, useState } from 'react';

import { Alert } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { toastError } from 'app/toaster';
import { t } from 'lib/i18n';
import { serializeError } from 'lib/utils/serialize-error';

interface DeleteBackupModalProps {
  onCancel: EmptyFn;
  onDelete: () => void | Promise<void>;
}

export const DeleteBackupModal = memo<DeleteBackupModalProps>(({ onCancel, onDelete }) => {
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const handleDelete = useCallback(async () => {
    setDeleteInProgress(true);
    try {
      await onDelete();
    } catch (e) {
      console.error(e);
      toastError(serializeError(e) ?? t('unknownError'));
    } finally {
      setDeleteInProgress(false);
    }
  }, [onDelete, setDeleteInProgress]);

  return (
    <ActionModal title={t('deleteExistingBackupQuestion')}>
      <ActionModalBodyContainer className="pt-3 pb-1 gap-3">
        <Alert description={t('deleteBackupWarning')} type="warning" />
        <p className="text-font-description text-center text-grey-1">{t('deleteBackupDescription')}</p>
      </ActionModalBodyContainer>
      <ActionModalButtonsContainer>
        <ActionModalButton color="primary-low" onClick={onCancel} type="button">
          {t('cancel')}
        </ActionModalButton>
        <ActionModalButton color="red" onClick={handleDelete} type="button" loading={deleteInProgress}>
          {t('delete')}
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
