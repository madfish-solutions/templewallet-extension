import React, { memo, ReactNode } from 'react';

import clsx from 'clsx';

import { setTestID } from 'lib/analytics';
import { T } from 'lib/i18n';

import { formatRpAmount } from '../utils';

import styles from './recent-earnings.module.css';

interface StatsCardProps {
  periodName: ReactNode | ReactNode[];
  rpCount: number;
  adsCount: number;
  linksCount: number;
  background: 'golden' | 'bluish';
  testID?: string;
}

export const StatsCard = memo<StatsCardProps>(({ periodName, rpCount, adsCount, linksCount, background, testID }) => (
  <div
    className={clsx(
      'flex-1 p-4 rounded-2xl flex flex-col gap-3',
      background === 'golden' ? styles.goldenGradient : styles.bluishGradient
    )}
    {...setTestID(testID)}
  >
    <p className="text-2xs leading-5 text-gray-200">{periodName}</p>

    <p className="text-2xl leading-tight font-semibold text-white">{formatRpAmount(rpCount)} RP</p>

    <div className="flex gap-0.5 rounded-lg overflow-hidden">
      <StatsCardItem title={<T id="ads" />} value={adsCount} />
      <StatsCardItem title={<T id="links" />} value={linksCount} />
    </div>
  </div>
));

interface StatsCardItemProps {
  title: JSX.Element;
  value: number;
}

const StatsCardItem = memo<StatsCardItemProps>(({ title, value }) => (
  <div
    className={clsx(
      'flex-1 bg-white bg-opacity-15 rounded-sm p-0.5 flex flex-col items-center',
      'text-center text-white text-xs leading-5'
    )}
  >
    <span className="opacity-50">{title}</span>
    <span className="font-semibold">{formatRpAmount(value)}</span>
  </div>
));
