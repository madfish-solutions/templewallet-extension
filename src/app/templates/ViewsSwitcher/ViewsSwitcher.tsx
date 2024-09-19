import React, { memo } from 'react';

import ViewsSwitcherItem, { ViewsSwitcherItemProps } from './ViewsSwitcherItem';

interface ViewsSwitcherProps {
  activeItem: ViewsSwitcherItemProps;
  items: ViewsSwitcherItemProps[];
  onChange: (item: ViewsSwitcherItemProps) => void;
}

const ViewsSwitcher = memo(({ activeItem, items, onChange }: ViewsSwitcherProps) => (
  <div className="flex items-center truncate">
    {items.map((item, index, arr) => (
      <ViewsSwitcherItem
        key={item.key}
        currentItem={item}
        currentItemIndex={index}
        activeItem={activeItem}
        totalItemsLength={arr.length}
        onChange={onChange}
      />
    ))}
  </div>
));

export default ViewsSwitcher;
