import classNames from "clsx";
import React, { useCallback } from "react";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";

export type OptionRenderProps<T> = {
  item: T;
  index: number;
};

export type SelectMenuProps<T, K extends string | number> = {
  activeItemId?: K;
  getItemId: (item: T) => K;
  id?: string;
  items: T[];
  maxHeight?: string;
  padding?: React.CSSProperties["padding"];
  onSelect: (itemId: K) => void;
  Icon?: React.ComponentType<OptionRenderProps<T>>;
  Content: React.ComponentType<OptionRenderProps<T>>;
};

const SelectMenu = <T extends {}, K extends string | number>(
  props: SelectMenuProps<T, K>
) => {
  const {
    activeItemId,
    getItemId,
    id,
    items,
    maxHeight,
    onSelect,
    padding = "0.4rem 0.375rem 0.4rem 0.375rem",
    Icon,
    Content,
  } = props;

  return (
    <div
      className={classNames(
        "rounded-md overflow-y-auto border-2 bg-gray-100",
        "flex flex-col text-gray-700 text-sm leading-tight"
      )}
      id={id}
      style={{ maxHeight }}
    >
      {items.map((item, index) => {
        const itemId = getItemId(item);

        return (
          <SelectMenuItem
            key={itemId}
            active={itemId === activeItemId}
            last={index === items.length - 1}
            itemId={itemId}
            index={index}
            item={item}
            onSelect={onSelect}
            padding={padding}
            Icon={Icon}
            Content={Content}
          />
        );
      })}
    </div>
  );
};

export default SelectMenu;

type SelectMenuItemProps<T, K extends string | number> = Pick<
  SelectMenuProps<T, K>,
  "onSelect" | "Icon" | "Content" | "padding"
> & {
  active?: boolean;
  last?: boolean;
  itemId: K;
  index: number;
  item: T;
};

const SelectMenuItem = <T extends {}, K extends string | number>(
  props: SelectMenuItemProps<T, K>
) => {
  const {
    active,
    itemId,
    item,
    index,
    last,
    onSelect,
    padding,
    Icon,
    Content,
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
      {Icon && <Icon item={item} index={index} />}

      <div className={classNames("flex flex-col items-start", Icon && "ml-2")}>
        <Content item={item} index={index} />
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
