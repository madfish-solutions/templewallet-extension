import React, { memo, useMemo, useState } from 'react';

import classNames from 'clsx';

import { OP_STACK_PREVIEW_SIZE } from 'app/defaults';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import { T } from 'lib/i18n/react';
import { OperStackItemInterface } from 'lib/temple/activity-new/types';

import { OperStackItem } from './OperStackItem';

interface Props {
  operStack: OperStackItemInterface[];
  className?: string;
}

export const OperStack = memo<Props>(({ operStack, className }) => {
  const [expanded, setExpanded] = useState(false);

  const base = useMemo(() => operStack.filter((_, i) => i < OP_STACK_PREVIEW_SIZE), [operStack]);
  const rest = useMemo(() => operStack.filter((_, i) => i >= OP_STACK_PREVIEW_SIZE), [operStack]);

  const ExpandIcon = expanded ? ChevronUpIcon : ChevronRightIcon;

  return (
    <div className={classNames('flex flex-col', className)}>
      {base.map((item, i) => (
        <OperStackItem key={i} item={item} />
      ))}

      {expanded && (
        <>
          {rest.map((item, i) => (
            <OperStackItem key={i} item={item} />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <div className={classNames('flex items-center', expanded && 'mt-1')}>
          <button
            className={classNames('flex items-center', 'text-blue-600 opacity-75 hover:underline', 'leading-none')}
            onClick={() => setExpanded(e => !e)}
          >
            <ExpandIcon className="mr-1 h-3 w-auto stroke-2 stroke-current text-gray-500" />
            <T id={expanded ? 'less' : 'more'} />
          </button>
        </div>
      )}
    </div>
  );
});
