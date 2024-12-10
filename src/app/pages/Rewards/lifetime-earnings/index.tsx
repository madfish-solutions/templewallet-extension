import React, { memo, useCallback } from 'react';

import { Button } from 'app/atoms';
import { ReactComponent as TriangleDownIcon } from 'app/icons/triangle-down.svg';
import { T, t } from 'lib/i18n';

import { Section } from '../section';
import { formatRpAmount, getMonthName } from '../utils';

const mockData = [
  { date: new Date(2024, 9, 1), value: 11257 },
  { date: new Date(2024, 8, 1), value: 1024 },
  { date: new Date(2024, 7, 1), value: 14157 }
];

export const LifetimeEarnings = memo(() => {
  const loadMore = useCallback(() => console.log('TODO: Load more'), []);

  return (
    <Section title={t('lifetimeEarnings')}>
      {mockData.map(({ date, value }) => (
        <div
          className="p-4 flex items-center justify-between bg-gray-100 text-sm text-gray-910 rounded-2xl"
          key={date.getTime()}
        >
          <span>{getMonthName(date)}</span>
          <span className="font-semibold">{formatRpAmount(value)} RP</span>
        </div>
      ))}

      <Button
        className="mt-1 p-1 flex items-center justify-center gap-0.5 text-blue-500 font-semibold text-2xs leading-snug uppercase"
        onClick={loadMore}
      >
        <T id="loadMore" />

        <TriangleDownIcon className="w-4 h-4 fill-current stroke-current" />
      </Button>
    </Section>
  );
});
