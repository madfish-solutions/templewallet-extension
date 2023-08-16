import React, { FC, useMemo } from 'react';

import { format, isSameDay } from 'date-fns';

import { getDateFnsLocale, T } from 'lib/i18n';

interface Props {
  /** ISO timestamp */
  timestamp: string;
}

export const DateView: FC<Props> = ({ timestamp }) => {
  const date = useMemo(() => new Date(timestamp), [timestamp]);
  const dateFnsLocale = getDateFnsLocale();
  const formattedDate = useMemo(() => format(date, 'd MMMM, yyyy', { locale: dateFnsLocale }), [date, dateFnsLocale]);

  return isSameDay(new Date(), date) ? <T id="today" /> : <>{formattedDate}</>;
};
