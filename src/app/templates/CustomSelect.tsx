import classNames from "clsx";
import React, { useCallback } from "react";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";

type Actions<K extends string | number> = { [key: string]: (id: K) => void };

export type OptionRenderProps<
  T,
  K extends string | number = string | number,
  A extends Actions<K> = {}
> = {
  actions?: A;
  item: T;
  index: number;
};

export type CustomSelectProps<
  T,
  K extends string | number = string | number,
  A extends Actions<K> = {}
> = {
  activeItemId?: K;
  actions?: A;
  className?: string;
  getItemId: (item: T) => K;
  iconClassName?: string;
  id?: string;
  items: T[];
  maxHeight?: string;
  padding?: React.CSSProperties["padding"];
  autoFocus?: boolean;
  onSelect?: (itemId: K) => void;
  OptionIcon?: React.ComponentType<OptionRenderProps<T, K, A>>;
  OptionContent: React.ComponentType<OptionRenderProps<T, K, A>>;
};

const CustomSelect = <
  T extends {},
  K extends string | number = string | number,
  A extends Actions<K> = {}
>(
  props: CustomSelectProps<T, K, A>
) => {
  const {
    actions,
    activeItemId,
    className,
    getItemId,
    iconClassName,
    id,
    items,
    maxHeight,
    onSelect,
    padding = "0.4rem 0.375rem 0.4rem 0.375rem",
    autoFocus = false,
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
            actions={actions}
            active={itemId === activeItemId}
            last={index === items.length - 1}
            iconClassName={iconClassName}
            itemId={itemId}
            index={index}
            item={item}
            onSelect={onSelect}
            padding={padding}
            autoFocus={autoFocus}
            OptionIcon={OptionIcon}
            OptionContent={OptionContent}
          />
        );
      })}
    </div>
  );
};

export default CustomSelect;

type CustomSelectItemProps<
  T,
  K extends string | number,
  A extends Actions<K>
> = Pick<
  CustomSelectProps<T, K, A>,
  | "onSelect"
  | "OptionIcon"
  | "OptionContent"
  | "padding"
  | "autoFocus"
  | "actions"
  | "iconClassName"
> & {
  active?: boolean;
  last?: boolean;
  itemId: K;
  index: number;
  item: T;
};

const CustomSelectItem = <
  T extends {},
  K extends string | number,
  A extends Actions<K>
>(
  props: CustomSelectItemProps<T, K, A>
) => {
  const {
    active,
    actions,
    iconClassName,
    itemId,
    item,
    index,
    last,
    onSelect,
    padding,
    autoFocus,
    OptionIcon,
    OptionContent,
  } = props;

  const handleSelect = useCallback(() => onSelect?.(itemId), [
    itemId,
    onSelect,
  ]);

  const ItemComponent = onSelect ? "button" : "div";

  return (
    <ItemComponent
      type="button"
      className={classNames(
        "w-full flex-shrink-0 overflow-hidden",
        !last && "border-b border-gray-200",
        active ? "bg-gray-300" : "hover:bg-gray-200 focus:bg-gray-200",
        "flex items-center text-gray-700 transition ease-in-out duration-200",
        "focus:outline-none opacity-90 hover:opacity-100"
      )}
      style={{ padding }}
      autoFocus={autoFocus && active}
      onClick={handleSelect}
    >
      {OptionIcon && <OptionIcon actions={actions} item={item} index={index} />}

      <div
        className={classNames(
          "w-full flex flex-col items-start",
          OptionIcon && "ml-2"
        )}
      >
        <OptionContent actions={actions} item={item} index={index} />
      </div>

      <div className="flex-1" />

      {active && (
        <OkIcon
          className={classNames("w-auto h-5 mx-2 stroke-2", iconClassName)}
          style={{
            stroke: "#777",
          }}
        />
      )}
    </ItemComponent>
  );
};
