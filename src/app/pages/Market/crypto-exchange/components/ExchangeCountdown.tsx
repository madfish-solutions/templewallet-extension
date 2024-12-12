import React, { memo } from 'react';

import Countdown from 'react-countdown';

import { getExchangeData } from 'lib/apis/exolix/utils';

import { useCryptoExchangeDataState } from '../context';

const FORTY_FIVE_MINUTES_IN_MS = 45 * 60 * 1000;

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
          {props.minutes}:{props.seconds < 10 ? '0' + props.seconds : props.seconds}
        </span>
      )}
      date={new Date(exchangeData.createdAt).getTime() + FORTY_FIVE_MINUTES_IN_MS}
      onComplete={async () => {
        const data = await getExchangeData(exchangeData.id);
        setExchangeData(data);
      }}
    />
  );
});
