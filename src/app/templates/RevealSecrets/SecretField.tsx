import React, { FC, useMemo } from 'react';

import { Alert } from 'app/atoms/Alert';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { TID, T } from 'lib/i18n';
import { SPACE_CHAR } from 'lib/ui/utils';

import { RevealSecretsSelectors } from './RevealSecrets.selectors';

interface Props {
  revealType: 'private-key' | 'seed-phrase';
  value: string;
}

interface Texts {
  title: TID;
  description: React.ReactNode;
  attention: TID;
}

export const SecretField: FC<Props> = ({ revealType, value }) => {
  const texts = useMemo<Texts>(() => {
    switch (revealType) {
      case 'private-key':
        return {
          title: 'privateKey',
          description: <T id="privateKeyFieldDescription" />,
          attention: 'doNotSharePrivateKey'
        };

      case 'seed-phrase':
        return {
          title: 'seedPhrase',
          description: (
            <>
              <T id="youWillNeedThisSeedPhrase" />
              {SPACE_CHAR}
              <T id="keepSeedPhraseSecret" />
            </>
          ),
          attention: 'doNotSharePhrase'
        };
    }
  }, [revealType]);

  return (
    <>
      <ReadOnlySecretField
        value={value}
        label={texts.title}
        description={texts.description}
        testID={RevealSecretsSelectors.RevealSecretsValue}
        secretCoverTestId={RevealSecretsSelectors.RevealSecretsProtectedMask}
      />

      <Alert
        title={<T id="attentionExclamation" />}
        description={
          <p>
            <T id={texts.attention} />
          </p>
        }
        className="my-4"
      />
    </>
  );
};
