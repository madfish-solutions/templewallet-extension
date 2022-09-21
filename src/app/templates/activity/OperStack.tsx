import React, { memo, useMemo, useState } from 'react';

import classNames from 'clsx';

import { OP_STACK_PREVIEW_SIZE } from 'app/defaults';
import { ReactComponent as ChevronRightIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/chevron-up.svg';
import { ReactComponent as ClipboardIcon } from 'app/icons/clipboard.svg';
import HashChip from 'app/templates/HashChip';
import type { TID } from 'lib/i18n/react';
import { T } from 'lib/i18n/react';
import { OperStackItem, OperStackItemType } from 'lib/temple/activity-new/types';

type OpStackProps = {
  opStack: OperStackItem[];
  className?: string;
};

const OperStackComponent = memo<OpStackProps>(({ opStack, className }) => {
  const [expanded, setExpanded] = useState(false);

  const base = useMemo(() => opStack.filter((_, i) => i < OP_STACK_PREVIEW_SIZE), [opStack]);
  const rest = useMemo(() => opStack.filter((_, i) => i >= OP_STACK_PREVIEW_SIZE), [opStack]);

  const ExpandIcon = expanded ? ChevronUpIcon : ChevronRightIcon;

  return (
    <div className={classNames('flex flex-col', className)}>
      {base.map((item, i) => (
        <OperStackItemComponent key={i} item={item} />
      ))}

      {expanded && (
        <>
          {rest.map((item, i) => (
            <OperStackItemComponent key={i} item={item} />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <div className={classNames('flex items-center', expanded && 'mt-1')}>
          <button
            className={classNames('flex items-center', 'text-blue-600 opacity-75 hover:underline', 'leading-none')}
            onClick={() => setExpanded(e => !e)}
          >
            <ExpandIcon className={classNames('mr-1 h-3 w-auto', 'stroke-2 stroke-current')} />
            <T id={expanded ? 'less' : 'more'} />
          </button>
        </div>
      )}
    </div>
  );
});

export default OperStackComponent;

type OperStackItemProps = {
  item: OperStackItem;
};

const OperStackItemComponent = memo<OperStackItemProps>(({ item }) => {
  const toRender = ((): {
    base: React.ReactNode;
    argsI18nKey?: TID;
    args?: string[];
  } => {
    switch (item.type) {
      case OperStackItemType.Delegation:
        return {
          base: (
            <>
              <T id="delegation" />
            </>
          ),
          argsI18nKey: 'delegationToSmb',
          args: [item.to]
        };

      case OperStackItemType.Origination:
        return {
          base: (
            <>
              <T id="origination" />
            </>
          )
        };

      case OperStackItemType.Interaction:
        return {
          base: (
            <>
              <ClipboardIcon className="mr-1 h-3 w-auto stroke-current" />
              <T id="interaction" />
            </>
          ),
          argsI18nKey: 'interactionWithContract',
          args: [item.with]
        };

      case OperStackItemType.TransferFrom:
        return {
          base: (
            <>
              ↓ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferFromSmb',
          args: [item.from]
        };

      case OperStackItemType.TransferTo:
        return {
          base: (
            <>
              ↑ <T id="transfer" />
            </>
          ),
          argsI18nKey: 'transferToSmb',
          args: [item.to]
        };

      case OperStackItemType.Other:
        return {
          base: item.name
            .split('_')
            .map(w => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
            .join(' ')
        };
    }
  })();

  return (
    <div className="flex flex-wrap items-center">
      <div className={classNames('flex items-center', 'text-xs text-blue-600 opacity-75')}>{toRender.base}</div>

      {toRender.argsI18nKey && toRender.args && (
        <StackItemArgs i18nKey={toRender.argsI18nKey} args={toRender.args} className="ml-1" />
      )}
    </div>
  );
});

type StackItemArgsProps = {
  i18nKey: TID;
  args: string[];
  className?: string;
};

const StackItemArgs = memo<StackItemArgsProps>(({ i18nKey, args, className }) => (
  <span className={classNames('font-light text-gray-500 text-xs', className)}>
    <T
      id={i18nKey}
      substitutions={args.map((value, index) => (
        <span key={index}>
          <HashChip className="text-blue-600 opacity-75" key={index} hash={value} type="link" />
          {index === args.length - 1 ? null : ', '}
        </span>
      ))}
    />
  </span>
));
