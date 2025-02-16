import React, { memo } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

import { InfoContainer, InfoRaw } from '../../components/InfoBlock';
import { DisplayExchangeValue } from '../../crypto-exchange/components/DisplayExchangeValue';
import { VALUE_PLACEHOLDER } from '../config';

interface Props {
  rate: number | nullish;
  inputCurrencyCode: string;
  outputCurrencyCode: string;
  className?: string;
}

export const InfoCard = memo<Props>(({ rate, inputCurrencyCode, outputCurrencyCode, className }) => (
  <InfoContainer className={clsx('mb-8', className)}>
    <InfoRaw bottomSeparator title="exchangeRate">
      <span className="p-1 text-font-description">
        {rate ? (
          <>
            <span>{`1 ${inputCurrencyCode} = `}</span>
            <DisplayExchangeValue value={rate} currencyCode={outputCurrencyCode} />
          </>
        ) : (
          VALUE_PLACEHOLDER
        )}
      </span>
    </InfoRaw>

    <p className="py-2 px-1 text-font-small text-grey-1">
      <T id="warningTopUpServiceMessage" />
    </p>
  </InfoContainer>
));
