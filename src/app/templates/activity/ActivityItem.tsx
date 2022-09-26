import React, { useEffect, useState, useMemo, memo } from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import MoneyDiffView from 'app/templates/activity/MoneyDiffView';
import OperStackComp from 'app/templates/activity/OperStack';
import HashChip from 'app/templates/HashChip';
import { t, getDateFnsLocale } from 'lib/i18n/react';
import { parseOperStack, parseMoneyDiffs } from 'lib/temple/activity-new/helpers';
import type { Activity } from 'lib/temple/activity-new/types';
import { useExplorerBaseUrls } from 'lib/temple/front';

interface ActivityItemCompProps {
  activity: Activity;
  address: string;
  syncSupported: boolean;
}

const ActivityItemComp = memo<ActivityItemCompProps>(({ activity, address, syncSupported }) => {
  const { hash, addedAt, status } = activity;

  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();

  const operStack = useMemo(() => parseOperStack(activity, address), [activity, address]);

  const moneyDiffs = useMemo(() => {
    return ['pending', 'applied'].includes(status) ? parseMoneyDiffs(activity) : [];
  }, [status, activity]);

  return (
    <div className={classNames('my-3')}>
      <div className="w-full flex items-center">
        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={hash} className="mr-2" />}

        <div className={classNames('flex-1', 'h-px', 'bg-gray-200')} />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col pt-2">
          <OperStackComp opStack={operStack} className="mb-2" />

          <ActivityItemStatusComp activity={activity} syncSupported={syncSupported} />

          <Time
            children={() => (
              <span className="text-xs font-light text-gray-500">
                {formatDistanceToNow(new Date(addedAt), {
                  includeSeconds: true,
                  addSuffix: true,
                  locale: getDateFnsLocale()
                })}
              </span>
            )}
          />
        </div>

        <div className="flex-1" />

        <div className="flex flex-col flex-shrink-0 pt-2">
          {moneyDiffs.map(({ assetSlug, diff }, i) => (
            <MoneyDiffView key={i} assetId={assetSlug} diff={diff} pending={status === 'pending'} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default ActivityItemComp;

interface ActivityItemStatusCompProps {
  activity: Activity;
  syncSupported: boolean;
}

const ActivityItemStatusComp: React.FC<ActivityItemStatusCompProps> = ({ activity, syncSupported }) => {
  if (syncSupported === false) return null;

  const explorerStatus = activity.status;
  const content = explorerStatus ?? 'pending';
  const conditionalTextColor = explorerStatus ? 'text-red-600' : 'text-yellow-600';

  return (
    <div className="mb-px text-xs font-light leading-none">
      <span className={classNames(explorerStatus === 'applied' ? 'text-gray-600' : conditionalTextColor, 'capitalize')}>
        {t(content) || content}
      </span>
    </div>
  );
};

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = useState(children);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(children());
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [setValue, children]);

  return value;
};
