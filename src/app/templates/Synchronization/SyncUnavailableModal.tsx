import React, { FC } from 'react';

import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { t, T } from 'lib/i18n';

import { SyncSettingsSelectors } from './SyncSettings.selectors';

interface Props {
  onClose: EmptyFn;
}

export const SyncUnavailableModal: FC<Props> = ({ onClose }) => (
  <ActionModal title={t('templeSync')} hasCloseButton onClose={onClose}>
    <ActionModalBodyContainer className="items-center pt-4 pb-4">
      <p className="mb-5 text-grey-1 text-font-description text-center">
        <T id="syncUnavailable" />
      </p>

      <StyledButton
        size="L"
        color="primary"
        onClick={onClose}
        testID={SyncSettingsSelectors.gotItButton}
        className="w-full"
      >
        <T id="okGotIt" />
      </StyledButton>
    </ActionModalBodyContainer>
  </ActionModal>
);
