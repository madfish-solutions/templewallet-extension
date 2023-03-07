import { ComponentType, ReactNode } from 'react';

export type IconifiedSelectOptionRenderProps<T> = {
  option: T;
  index?: number;
};

export type IconifiedSelectRenderComponent<T> = ComponentType<IconifiedSelectOptionRenderProps<T>>;

export interface IconifiedSelectPropsBase<T> {
  Icon: IconifiedSelectRenderComponent<T>;
  OptionInMenuContent: IconifiedSelectRenderComponent<T>;
  getKey: (option: T) => string | number | undefined;
  isDisabled?: (option: T) => boolean;
  onChange?: (a: T) => void;
  options: T[];
  value: T;
  noItemsText: string;
  padded?: boolean;
}

export interface IconifiedSelectProps<T> extends IconifiedSelectPropsBase<T> {
  OptionSelectedIcon: IconifiedSelectRenderComponent<T>;
  OptionSelectedContent: IconifiedSelectRenderComponent<T>;
  className?: string;
  title: ReactNode;
  fieldStyle?: React.CSSProperties;
  search?: {
    placeholder?: string;
    filterItems(searchString: string): T[];
  };
}
