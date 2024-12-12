import React, { memo } from 'react';

import { T } from 'lib/i18n';

import { InfoContainer, InfoRaw } from '../../../components/InfoBlock';
import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK } from '../../../config';

interface Props {
  exchangeRate: string;
}

export const InfoCard = memo<Props>(({ exchangeRate }) => (
  <InfoContainer className="mb-8">
    <InfoRaw bottomSeparator title="exchangeRate">
      <span className="p-1 text-font-description">{exchangeRate}</span>
    </InfoRaw>

    <div className="pt-2 px-1 flex flex-col gap-y-2 text-font-small text-grey-1">
      <p>
        <T
          id="privacyAndPolicyLinks"
          substitutions={[
            <T id="exchange" key="buttonContent" />,
            <a
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_TERMS_LINK}
              target="_blank"
              key="termsOfUse"
            >
              <T id="termsOfUse" />
            </a>,
            <a
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_PRIVICY_LINK}
              target="_blank"
              key="privacy"
            >
              <T id="privacyPolicy" />
            </a>
          ]}
        />
      </p>
      <p>
        <T id="warningTopUpServiceMessage" />
      </p>
    </div>
  </InfoContainer>
));
