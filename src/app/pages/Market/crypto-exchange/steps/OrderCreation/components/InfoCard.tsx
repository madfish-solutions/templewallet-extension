import React, { memo } from 'react';

import { T } from 'lib/i18n';

import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK } from '../../../config';

interface Props {
  exchangeRate: string;
}

export const InfoCard = memo<Props>(({ exchangeRate }) => (
  <div className="flex flex-col pt-2 p-4 mb-8 rounded-lg shadow-bottom border-0.5 border-transparent">
    <div className="py-3 flex flex-row justify-between items-center border-b-0.5 border-lines text-font-description">
      <p className="p-1 text-grey-1">
        <T id="exchangeRate" />
      </p>
      <p className="p-1">{exchangeRate}</p>
    </div>

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
  </div>
));
