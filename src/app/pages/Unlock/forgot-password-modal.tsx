import React, { memo } from 'react';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T, t } from 'lib/i18n';

import { UnlockSelectors } from './Unlock.selectors';

interface ForgotPasswordModalProps {
  onClose: EmptyFn;
  onContinueClick: EmptyFn;
}

export const ForgotPasswordModal = memo<ForgotPasswordModalProps>(({ onClose, onContinueClick }) => (
  <ActionModal title={t('forgotPasswordModalTitle')} onClose={onClose}>
    <ActionModalBodyContainer>
      <p className="text-font-description text-grey-1 text-center pt-1.5 pb-1">{t('forgotPasswordModalDescription')}</p>
    </ActionModalBodyContainer>
    <ActionModalButtonsContainer>
      <ActionModalButton
        color="primary"
        onClick={onContinueClick}
        type="button"
        testID={UnlockSelectors.continueResetButton}
      >
        <T id="continue" />
      </ActionModalButton>
    </ActionModalButtonsContainer>
  </ActionModal>
));
