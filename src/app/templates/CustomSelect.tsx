import classNames from "clsx";
import React, { useCallback } from "react";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";

export type OptionRenderProps<T> = {
  item: T;
  index: number;
};

export type CustomSelectProps<T, K extends string | number> = {
  activeItemId?: K;
  className?: string;
  getItemId: (item: T) => K;
  id?: string;
  items: T[];
  maxHeight?: string;
  padding?: React.CSSProperties["padding"];
  onSelect: (itemId: K) => void;
  OptionIcon?: React.ComponentType<OptionRenderProps<T>>;
  OptionContent: React.ComponentType<OptionRenderProps<T>>;
};

const CustomSelect = <T extends {}, K extends string | number>(
  props: CustomSelectProps<T, K>
) => {
  const {
    activeItemId,
    className,
    getItemId,
    id,
    items,
    maxHeight,
    onSelect,
    padding = "0.4rem 0.375rem 0.4rem 0.375rem",
    OptionIcon,
    OptionContent,
  } = props;

  return (
    <div
      className={classNames(
        "rounded-md overflow-y-auto border-2 bg-gray-100",
        "flex flex-col text-gray-700 text-sm leading-tight",
        className
      )}
      id={id}
      style={{ maxHeight }}
    >
      {items.map((item, index) => {
        const itemId = getItemId(item);

        return (
          <CustomSelectItem
            key={itemId}
            active={itemId === activeItemId}
            last={index === items.length - 1}
            itemId={itemId}
            index={index}
            item={item}
            onSelect={onSelect}
            padding={padding}
            OptionIcon={OptionIcon}
            OptionContent={OptionContent}
          />
        );
      })}
    </div>
  );
};

export default CustomSelect;

type CustomSelectItemProps<T, K extends string | number> = Pick<
  CustomSelectProps<T, K>,
  "onSelect" | "OptionIcon" | "OptionContent" | "padding"
> & {
  active?: boolean;
  last?: boolean;
  itemId: K;
  index: number;
  item: T;
};

const CustomSelectItem = <T extends {}, K extends string | number>(
  props: CustomSelectItemProps<T, K>
) => {
  const {
    active,
    itemId,
    item,
    index,
    last,
    onSelect,
    padding,
    OptionIcon,
    OptionContent,
  } = props;

  const handleSelect = useCallback(() => onSelect(itemId), [itemId, onSelect]);

  return (
    <button
      type="button"
      className={classNames(
        "w-full flex-shrink-0 overflow-hidden",
        !last && "border-b border-gray-200",
        active ? "bg-gray-300" : "hover:bg-gray-200 focus:bg-gray-200",
        "flex items-center text-gray-700 transition ease-in-out duration-200",
        "focus:outline-none opacity-90 hover:opacity-100"
      )}
      style={{ padding }}
      autoFocus={active}
      onClick={handleSelect}
    >
      {OptionIcon && <OptionIcon item={item} index={index} />}

      <div
        className={classNames(
          "flex flex-col items-start",
          OptionIcon && "ml-2"
        )}
      >
        <OptionContent item={item} index={index} />
      </div>

      <div className="flex-1" />

      {active && (
        <OkIcon
          className="mx-2 h-5 w-auto stroke-2"
          style={{
            stroke: "#777",
          }}
        />
      )}
    </button>
  );
};
