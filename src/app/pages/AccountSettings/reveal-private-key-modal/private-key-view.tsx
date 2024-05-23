import React, { memo } from 'react';

import { Alert } from 'app/atoms';
import { ActionModalBodyContainer, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { T } from 'lib/i18n';
import { TempleChainTitle } from 'temple/types';

import { PrivateKeyPayload } from './types';

interface PrivateKeyViewProps {
  privateKey: PrivateKeyPayload;
  onClose: () => void;
}

export const PrivateKeyView = memo<PrivateKeyViewProps>(({ privateKey, onClose }) => (
  <>
    <ActionModalBodyContainer>
      <Alert
        type="warning"
        description={
          <p className="text-font-description text-gray-900">
            <span className="font-semibold">Never share</span> your private key or enter it into any apps. It grants
            full access to your account.
          </p>
        }
      />

      <ReadOnlySecretField
        value={privateKey.privateKey}
        label="newRevealPrivateKeyLabel"
        labelSubstitutions={TempleChainTitle[privateKey.chain]}
        description={null}
      />
    </ActionModalBodyContainer>
    <ActionModalButtonsContainer>
      <ActionModalButton className="bg-primary-low text-primary" onClick={onClose} type="button">
        <T id="cancel" />
      </ActionModalButton>
    </ActionModalButtonsContainer>
  </>
));
