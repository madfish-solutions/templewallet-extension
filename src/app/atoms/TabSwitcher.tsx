import React, { useCallback } from "react";

import classNames from "clsx";

type TabSwitcherProps = {
  className?: string;
  tabsLabels: string[];
  activeTabIndex: number;
  onTabSelect: (index: number) => void;
};

const TabSwitcher: React.FC<TabSwitcherProps> = ({
  className,
  tabsLabels,
  activeTabIndex,
  onTabSelect,
}) => (
  <div
    className={classNames(
      "w-full flex justify-around border-b border-gray-300",
      className
    )}
  >
    {tabsLabels.map((tabLabel, index) => (
      <TabSwitcherItem
        key={index}
        active={activeTabIndex === index}
        index={index}
        onSelect={onTabSelect}
      >
        {tabLabel}
      </TabSwitcherItem>
    ))}
  </div>
);

export default TabSwitcher;

type TabSwitcherItemProps = {
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
};

const TabSwitcherItem: React.FC<TabSwitcherItemProps> = ({
  active,
  children,
  index,
  onSelect,
}) => {
  const handleSelect = useCallback(() => onSelect(index), [onSelect, index]);

  return (
    <>
      <div
        className="relative py-2 cursor-pointer"
        style={{ paddingLeft: "0.875rem", paddingRight: "0.875rem" }}
        onClick={handleSelect}
      >
        <span
          className={classNames(
            "text-base leading-tight",
            active ? "text-primary-orange" : "text-gray-500",
            "transition ease-in-out duration-200"
          )}
        >
          {children}
        </span>
        {active && (
          <div
            className="w-full bg-primary-orange absolute"
            style={{
              bottom: -3,
              left: 0,
              height: 2,
            }}
          />
        )}
      </div>
    </>
  );
};
