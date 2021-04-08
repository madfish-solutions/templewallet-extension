import React, { FunctionComponent, memo, SVGProps } from "react";

import classNames from "clsx";

import { Button } from "app/atoms/Button";
import { TestIDProps } from "lib/analytics";

export type ViewsSwitcherItemProps = {
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  key: string;
  name: string;
} & TestIDProps;

export type ViewsSwitcherProps = {
  activeItem: ViewsSwitcherItemProps;
  items: ViewsSwitcherItemProps[];
  onChange: (item: ViewsSwitcherItemProps) => void;
};

const ViewsSwitcher = memo(
  ({ activeItem, items, onChange }: ViewsSwitcherProps) => (
    <div className={classNames("flex items-center")}>
      {items.map((spf, i, arr) => {
        const first = i === 0;
        const last = i === arr.length - 1;
        const selected = activeItem.key === spf.key;
        const handleClick = () => onChange(spf);

        return (
          <Button
            key={spf.key}
            className={classNames(
              (() => {
                switch (true) {
                  case first:
                    return classNames("rounded rounded-r-none", "border");

                  case last:
                    return classNames(
                      "rounded rounded-l-none",
                      "border border-l-0"
                    );

                  default:
                    return "border border-l-0";
                }
              })(),
              selected && "bg-gray-100",
              "px-2 py-1",
              "text-xs text-gray-600",
              "flex items-center"
            )}
            onClick={handleClick}
            testID={spf.testID}
          >
            <spf.Icon
              className={classNames("h-4 w-auto mr-1", "stroke-current")}
            />
            {spf.name}
          </Button>
        );
      })}
    </div>
  )
);

export default ViewsSwitcher;
