import React, { memo } from 'react';

import Countdown from 'react-countdown';

import { getExchangeData } from 'lib/apis/exolix/utils';

import { useCryptoExchangeDataState } from '../context';

const ORDER_EXPIRATION_TIMEOUT = 25 * 60 * 1000;

interface Props {
  className?: string;
}

export const ExchangeCountdown = memo<Props>(({ className }) => {
  const { exchangeData, setExchangeData } = useCryptoExchangeDataState();

  if (!exchangeData) return null;

  return (
    <Countdown
      renderer={props => (
        <span className={className}>
          {props.minutes}:{String(props.seconds).padStart(2, '0')}
        </span>
      )}
      date={new Date(exchangeData.createdAt).getTime() + ORDER_EXPIRATION_TIMEOUT}
      onComplete={async () => {
        const data = await getExchangeData(exchangeData.id);
        setExchangeData(data);
      }}
    />
  );
});
