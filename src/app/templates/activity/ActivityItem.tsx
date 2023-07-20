import React, { useEffect, useState, useMemo, memo } from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { HashChip, OpenInExplorerChip } from 'app/atoms';
import { MoneyDiffView } from 'app/templates/activity/MoneyDiffView';
import { OperStack } from 'app/templates/activity/OperStack';
import { getDateFnsLocale } from 'lib/i18n';
import { t } from 'lib/i18n/react';
import { Activity, buildOperStack, buildMoneyDiffs } from 'lib/temple/activity-new';
import { useExplorerBaseUrls } from 'lib/temple/front';

interface Props {
  activity: Activity;
  address: string;
}

export const ActivityItem = memo<Props>(({ activity, address }) => {
  const { hash, addedAt, status } = activity;

  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();

  const operStack = useMemo(() => buildOperStack(activity, address), [activity, address]);
  const moneyDiffs = useMemo(() => buildMoneyDiffs(activity), [activity]);

  return (
    <div className={classNames('my-3')}>
      <div className="w-full flex items-center">
        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={hash} className="mr-2" />}

        <div className={classNames('flex-1', 'h-px', 'bg-gray-200')} />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col pt-2">
          <OperStack operStack={operStack} className="mb-2" />

          <ActivityItemStatusComp activity={activity} />

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

interface ActivityItemStatusCompProps {
  activity: Activity;
}

const ActivityItemStatusComp: React.FC<ActivityItemStatusCompProps> = ({ activity }) => {
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
