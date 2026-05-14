import React, { memo } from 'react';

import Countdown from 'react-countdown';

import { EXOLIX_DEPOSIT_WINDOW_MS, getExchangeData } from 'lib/apis/exolix/utils';

import { useCryptoExchangeDataState } from '../context';

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
      date={new Date(exchangeData.createdAt).getTime() + EXOLIX_DEPOSIT_WINDOW_MS}
      onComplete={async () => {
        const data = await getExchangeData(exchangeData.id);
        setExchangeData(data);
      }}
    />
  );
});
