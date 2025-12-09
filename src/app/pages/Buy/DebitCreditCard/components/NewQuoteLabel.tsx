import React, { memo, useEffect, useRef } from 'react';

import clsx from 'clsx';
import Countdown from 'react-countdown';

import { T, TID } from 'lib/i18n';

import { FORM_REFRESH_INTERVAL } from '../config';

interface Props {
  title: TID;
  lastFormRefreshTimestamp: number;
  className?: string;
}

export const NewQuoteLabel = memo<Props>(({ title, lastFormRefreshTimestamp, className }) => {
  const countdownRef = useRef<Countdown>(null);
  const lastTimestampRef = useRef(lastFormRefreshTimestamp);

  useEffect(() => {
    if (lastTimestampRef.current !== lastFormRefreshTimestamp) {
      countdownRef.current?.start();
      lastTimestampRef.current = lastFormRefreshTimestamp;
    }
  }, [lastFormRefreshTimestamp]);

  return (
    <div className={clsx('flex flex-row justify-between py-1', className)}>
      <span className="text-font-description-bold">
        <T id={title} />
      </span>

      <span>
        <span className="text-font-description text-grey-2 mr-0.5">
          <T id="newQuote" />
        </span>
        <Countdown
          ref={countdownRef}
          renderer={props => (
            <span className="w-7 inline-block text-font-description-bold text-end">
              {props.minutes}:{String(props.seconds).padStart(2, '0')}
            </span>
          )}
          date={lastFormRefreshTimestamp + FORM_REFRESH_INTERVAL}
        />
      </span>
    </div>
  );
});
