import React, { memo, useEffect, useRef } from 'react';

import clsx from 'clsx';
import Countdown from 'react-countdown';

import { T, TID } from 'lib/i18n';

interface Props {
  title: TID;
  nextFormRefreshAttemptTimestamp: number;
  className?: string;
}

export const NewQuoteLabel = memo<Props>(({ title, nextFormRefreshAttemptTimestamp, className }) => {
  const countdownRef = useRef<Countdown>(null);
  const lastTimestampRef = useRef(nextFormRefreshAttemptTimestamp);

  useEffect(() => {
    if (lastTimestampRef.current !== nextFormRefreshAttemptTimestamp) {
      countdownRef.current?.start();
      lastTimestampRef.current = nextFormRefreshAttemptTimestamp;
    }
  }, [nextFormRefreshAttemptTimestamp]);

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
          date={nextFormRefreshAttemptTimestamp}
        />
      </span>
    </div>
  );
});
