import React, { FC, useState, useCallback, useMemo, useRef, useEffect } from 'react';

import clsx from 'clsx';

import { Alert } from 'app/atoms';
import { FieldLabel } from 'app/atoms/FieldLabel';
import { SecretCover } from 'app/atoms/SecretCover';
import { t, T } from 'lib/i18n';
import { selectNodeContent } from 'lib/ui/content-selection';

interface Props {
  revealType: 'private-key' | 'seed-phrase';
  value: string;
}

export const SecretField: FC<Props> = ({ revealType, value }) => {
  const [focused, setFocused] = useState(false);
  const fieldRef = useRef<HTMLParagraphElement>(null);

  const onSecretCoverClick = useCallback(() => void fieldRef.current?.focus(), []);

  const covered = !focused;

  useEffect(() => {
    if (!covered) selectNodeContent(fieldRef.current);
  }, [covered]);

  const texts = useMemo(() => {
    switch (revealType) {
      case 'private-key':
        return {
          name: t('privateKey'),
          attention: <T id="doNotSharePrivateKey" />,
          fieldDesc: <T id="privateKeyFieldDescription" />
        };

      case 'seed-phrase':
        return {
          name: t('seedPhrase'),
          attention: <T id="doNotSharePhrase" />,
          fieldDesc: (
            <>
              <T id="youWillNeedThisSeedPhrase" /> <T id="keepSeedPhraseSecret" />
            </>
          )
        };
    }
  }, [revealType]);

  return (
    <>
      <div className="w-full flex flex-col mb-4">
        <FieldLabel label={texts.name} description={texts.fieldDesc} className="mb-4" id="reveal-secret-secret" />

        <div className="relative flex items-stretch mb-2">
          <p
            ref={fieldRef}
            id="reveal-secret-secret"
            tabIndex={0}
            className={clsx(
              'appearance-none w-full py-3 pl-4 border-2 rounded-md bg-gray-100',
              'focus:border-primary-orange focus:bg-transparent focus:outline-none focus:shadow-outline',
              'transition ease-in-out duration-200',
              'text-gray-700 text-lg leading-tight placeholder-alphagray',
              //
              'h-32 break-words pr-4 overflow-y-auto'
            )}
            onFocus={() => void setFocused(true)}
            onBlur={() => void setFocused(false)}
          >
            {covered ? '' : value}
          </p>

          {covered && <SecretCover onClick={onSecretCoverClick} />}
        </div>
      </div>

      <Alert title={<T id="attentionExclamation" />} description={<p>{texts.attention}</p>} className="my-4" />
    </>
  );
};
