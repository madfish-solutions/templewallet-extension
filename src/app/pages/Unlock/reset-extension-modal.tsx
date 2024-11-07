import React, { memo, useCallback, useState } from 'react';

import browser from 'webextension-polyfill';

import { Alert } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T, t } from 'lib/i18n';
import { clearAllStorages } from 'lib/temple/reset';
import { useAlert } from 'lib/ui';

import { UnlockSelectors } from './Unlock.selectors';

interface ResetExtensionModalProps {
  onClose: EmptyFn;
}

export const ResetExtensionModal = memo<ResetExtensionModalProps>(({ onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const customAlert = useAlert();

  const resetWallet = useCallback(async () => {
    try {
      setSubmitting(true);
      await clearAllStorages();
      browser.runtime.reload();
    } catch (err: any) {
      await customAlert({
        title: t('error'),
        children: err.message
      });
    } finally {
      setSubmitting(false);
    }
  }, [customAlert]);

  return (
    <ActionModal title={t('resetExtensionModalTitle')} hasCloseButton={false} onClose={onClose}>
      <ActionModalBodyContainer>
        <Alert
          className="mb-1"
          type="warning"
          description={
            <p>
              <T id="unlockScreenResetModalAlertText" />
            </p>
          }
        />

        <p className="text-font-description text-grey-1 text-center pt-2 pb-1">
          <T id="unlockScreenResetModalDescription" />
        </p>
      </ActionModalBodyContainer>

      <ActionModalButtonsContainer>
        <ActionModalButton
          color="primary-low"
          disabled={submitting}
          onClick={onClose}
          type="button"
          testID={UnlockSelectors.cancelResetExtensionButton}
        >
          <T id="cancel" />
        </ActionModalButton>

        <ActionModalButton
          color="red"
          disabled={submitting}
          onClick={resetWallet}
          type="button"
          testID={UnlockSelectors.confirmResetExtensionButton}
        >
          <T id="reset" />
        </ActionModalButton>
      </ActionModalButtonsContainer>
    </ActionModal>
  );
});
