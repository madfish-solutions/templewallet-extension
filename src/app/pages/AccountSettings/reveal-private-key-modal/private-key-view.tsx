import React, { memo } from 'react';

import { Alert } from 'app/atoms';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { T } from 'lib/i18n';
import { TempleChainTitle } from 'temple/types';

import { AccountSettingsSelectors } from '../selectors';
import { PrivateKeyPayload } from '../types';

interface PrivateKeyViewProps {
  privateKey: PrivateKeyPayload;
}

export const PrivateKeyView = memo<PrivateKeyViewProps>(({ privateKey }) => (
  <>
    <Alert
      type="warning"
      className="my-4"
      description={
        <p className="text-font-description">
          <T
            id="privateKeyWarning"
            substitutions={[
              <span className="font-semibold" key="neverShare">
                <T id="neverShare" />
              </span>
            ]}
          />
        </p>
      }
    />

    <ReadOnlySecretField
      value={privateKey.privateKey}
      label="newRevealPrivateKeyLabel"
      labelSubstitutions={TempleChainTitle[privateKey.chain]}
      description={null}
      testID={AccountSettingsSelectors.privateKeyField}
      secretCoverTestId={AccountSettingsSelectors.privateKeyFieldCover}
    />
  </>
));
