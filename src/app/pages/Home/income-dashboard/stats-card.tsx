import { FC } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { SimpleChart } from 'app/atoms/SimpleChart';
import { Link } from 'lib/woozie';

interface StatsCardProps {
  linkTo: string;
  title: ReactChildren;
  value: ReactChildren;
  change?: ReactChildren;
  isChangePositive?: boolean;
  isChangeNegative?: boolean;
  caption?: ReactChildren;
  chartData?: { timestamp: number; value: number }[];
}

export const StatsCard: FC<StatsCardProps> = ({
  linkTo,
  title,
  value,
  change,
  isChangePositive = true,
  isChangeNegative = false,
  caption,
  chartData
}) => (
  <Link
    className={clsx(
      'bg-white rounded-8 border-0.5 border-lines p-4 flex flex-col min-h-25',
      isDefined(caption) && 'pb-0'
    )}
    to={linkTo}
  >
    <div className="text-font-description mb-2 text-grey-1">{title}</div>
    <div className="flex gap-2">
      <div className="flex flex-col gap-1">
        <div className="text-font-num-bold-14 min-w-full">{value}</div>
        {isDefined(change) && (
          <div
            className={clsx('text-font-description', {
              'text-success': isChangePositive,
              'text-error': isChangeNegative,
              'text-grey-1': !isChangePositive && !isChangeNegative
            })}
          >
            {change}
          </div>
        )}
      </div>
      {chartData && (
        <div className="flex-1">
          <SimpleChart data={chartData} />
        </div>
      )}
    </div>
    {isDefined(caption) && (
      <div
        className={clsx(
          'text-font-num-bold-10 bg-error-low text-error',
          'p-2 text-center flex justify-center -mx-4 mt-auto rounded-b-[7.5px]'
        )}
      >
        {caption}
      </div>
    )}
  </Link>
);
