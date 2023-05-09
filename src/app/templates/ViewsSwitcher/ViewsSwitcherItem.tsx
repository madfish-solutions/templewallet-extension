import React, { FC, FunctionComponent, SVGProps, useMemo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { TestIDProperty } from 'lib/analytics';
import useTippy from 'lib/ui/useTippy';

export interface ViewsSwitcherItemProps extends TestIDProperty {
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  key: string;
  name: string;
}

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
        'flex flex-1 items-center justify-center px-2 py-1',
        'text-xs text-gray-600 border truncate',
        selected && 'bg-gray-100',
        first ? 'rounded rounded-r-none' : last ? 'rounded rounded-l-none border-l-0' : 'border-l-0'
      )}
      onClick={handleClick}
      testID={currentItem.testID}
    >
      <currentItem.Icon className="h-4 w-auto mr-1 stroke-current" />
      <span className="truncate">{currentItem.name}</span>
    </Button>
  );
};

export default ViewsSwitcherItem;
