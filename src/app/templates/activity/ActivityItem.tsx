import React, { memo, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { OP_STACK_PREVIEW_SIZE } from 'app/defaults';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import { ReactComponent as ClipboardIcon } from 'app/icons/clipboard.svg';
import HashChip from 'app/templates/HashChip';
import type { TID } from 'lib/i18n/react';
import { T, t, getDateFnsLocale } from 'lib/i18n/react';
import { OpStackItem, OpStackItemType, parseMoneyDiffs, parseOpStack } from 'lib/temple/activity';
import { useExplorerBaseUrls } from 'lib/temple/front';
import * as Repo from 'lib/temple/repo';

import MoneyDiffView from './MoneyDiffView';
import OpStack from './OperStack';

type ActivityItemProps = {
  address: string;
  operation: Repo.IOperation;
  syncSupported: boolean;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(({ address, operation, syncSupported, className }) => {
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
  const { hash, addedAt } = operation;

  const pending = useMemo(
    () => syncSupported && !(operation.data.tzktGroup || operation.data.tzktTokenTransfers),
    [syncSupported, operation.data.tzktGroup, operation.data.tzktTokenTransfers]
  );

  const status = useMemo(() => {
    if (!syncSupported) return null;

    const explorerStatus = operation.data.tzktGroup?.[0]?.status;
    return explorerStatus ?? 'pending';
  }, [syncSupported, operation.data]);

  const moneyDiffs = useMemo(
    () => (!status || ['pending', 'applied'].includes(status) ? parseMoneyDiffs(operation, address) : []),
    [status, operation, address]
  );

  const opStack = useMemo(() => parseOpStack(operation, address), [operation, address]);

  const statusNode = useMemo(() => {
    if (!syncSupported) return null;

    const explorerStatus = operation.data.tzktGroup?.[0]?.status;
    const content = explorerStatus ?? 'pending';
    const conditionalTextColor = explorerStatus ? 'text-red-600' : 'text-yellow-600';

    return (
      <span className={classNames(explorerStatus === 'applied' ? 'text-gray-600' : conditionalTextColor, 'capitalize')}>
        {t(content) || content}
      </span>
    );
  }, [syncSupported, operation.data]);

  return (
    <div className={classNames('my-3', className)}>
      <div className="w-full flex items-center">
        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />

        {explorerBaseUrl && <OpenInExplorerChip baseUrl={explorerBaseUrl} hash={hash} className="mr-2" />}

        <div className={classNames('flex-1', 'h-px', 'bg-gray-200')} />
      </div>

      <div className="flex items-stretch">
        <div className="flex flex-col pt-2">
          <OpStack opStack={opStack} className="mb-2" />

          {statusNode && <div className="mb-px text-xs font-light leading-none">{statusNode}</div>}

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
          {moneyDiffs.map(({ assetId, diff }, i) => (
            <MoneyDiffView key={i} assetId={assetId} diff={diff} pending={pending} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default ActivityItem;

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
