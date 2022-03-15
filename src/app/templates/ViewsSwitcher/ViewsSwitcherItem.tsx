import React, { FC, FunctionComponent, SVGProps, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { TestIDProps } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';

export type ViewsSwitcherItemProps = {
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  key: string;
  name: string;
} & TestIDProps;

interface Props {
  currentItem: ViewsSwitcherItemProps;
  currentItemIndex: number;
  activeItem: ViewsSwitcherItemProps;
  totalItemsLength: number;
  onChange: (item: ViewsSwitcherItemProps) => void;
}

const ViewsSwitcherItem: FC<Props> = ({ currentItem, currentItemIndex, activeItem, totalItemsLength, onChange }) => {
  const tippyProps = useMemo(
    () => ({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: currentItem.name,
      animation: 'shift-away-subtle'
    }),
    [currentItem.name]
  );
  const tippyRef = useTippy<HTMLButtonElement>(tippyProps);

  const first = currentItemIndex === 0;
  const last = currentItemIndex === totalItemsLength - 1;
  const selected = activeItem.key === currentItem.key;
  const handleClick = () => onChange(currentItem);

  return (
    <Button
      ref={tippyRef}
      className={classNames(
        (() => {
          switch (true) {
            case first:
              return classNames('rounded rounded-r-none', 'border');

            case last:
              return classNames('rounded rounded-l-none', 'border border-l-0');

            default:
              return 'border border-l-0';
          }
        })(),
        selected && 'bg-gray-100',
        'px-2 py-1',
        'text-xs text-gray-600',
        'flex flex-1',
        'items-center justify-center',
        'truncate'
      )}
      onClick={handleClick}
      testID={currentItem.testID}
    >
      <currentItem.Icon className={classNames('h-4 w-auto mr-1', 'stroke-current')} />
      <span className={classNames('truncate')}>{currentItem.name}</span>
    </Button>
  );
};

export default ViewsSwitcherItem;
