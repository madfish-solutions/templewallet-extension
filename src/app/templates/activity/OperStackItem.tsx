import React, { memo } from 'react';

import { ReactComponent as ClipboardIcon } from 'app/icons/clipboard.svg';
import HashChip from 'app/templates/HashChip';
import { TID, T } from 'lib/i18n';
import { OperStackItemInterface, OperStackItemTypeEnum } from 'lib/temple/activity-new/types';

interface Props {
  item: OperStackItemInterface;
}

export const OperStackItem = memo<Props>(({ item }) => {
  switch (item.type) {
    case OperStackItemTypeEnum.Delegation:
      return (
        <StackItemBase
          titleNode={<T id="delegation" />}
          argsNode={<StackItemArgs i18nKey="delegationToSmb" args={[item.to]} />}
        />
      );

    case OperStackItemTypeEnum.Origination:
      return <StackItemBase titleNode={<T id="origination" />} />;

    case OperStackItemTypeEnum.Interaction:
      return (
        <StackItemBase
          titleNode={
            <>
              <ClipboardIcon className="mr-1 h-3 w-auto stroke-current" />
              <T id="interaction" />
            </>
          }
          argsNode={<StackItemArgs i18nKey="interactionWithContract" args={[item.with]} />}
        />
      );

    case OperStackItemTypeEnum.TransferFrom:
      return (
        <StackItemBase
          titleNode={
            <>
              ↓ <T id="transfer" />
            </>
          }
          argsNode={<StackItemArgs i18nKey="transferFromSmb" args={[item.from]} />}
        />
      );

    case OperStackItemTypeEnum.TransferTo:
      return (
        <StackItemBase
          titleNode={
            <>
              ↑ <T id="transfer" />
            </>
          }
          argsNode={<StackItemArgs i18nKey="transferToSmb" args={[item.to]} />}
        />
      );

    case OperStackItemTypeEnum.Other:
      return (
        <StackItemBase
          titleNode={item.name
            .split('_')
            .map(w => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
            .join(' ')}
        />
      );
  }
});

interface StackItemBaseProps {
  titleNode: React.ReactNode;
  argsNode?: React.ReactNode;
}
const StackItemBase: React.FC<StackItemBaseProps> = ({ titleNode, argsNode }) => {
  return (
    <div className="flex flex-wrap items-center">
      <div className="flex items-center text-xs text-blue-600 opacity-75">{titleNode}</div>

      {argsNode}
    </div>
  );
};

interface StackItemArgsProps {
  i18nKey: TID;
  args: string[];
}

const StackItemArgs = memo<StackItemArgsProps>(({ i18nKey, args }) => (
  <span className="font-light text-gray-500 text-xs ml-1">
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
