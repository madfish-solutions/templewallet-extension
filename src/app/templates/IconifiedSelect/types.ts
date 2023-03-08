import { ComponentType, ReactNode } from 'react';

/** TODO: Rename */
export type IconifiedSelectOptionRenderProps<T> = {
  option: T;
  index?: number;
};

export type OptionContentComponentProps<T> = {
  option: T;
  index?: number;
};

export type OptionContentComponent<T> = ComponentType<OptionContentComponentProps<T>>;

export interface IconifiedSelectPropsBase<T> {
  OptionContent: OptionContentComponent<T>;
  getKey: (option: T) => string | number | undefined;
  isDisabled?: (option: T) => boolean;
  onChange?: (a: T) => void;
  options: T[];
  value: T;
  noItemsText: string;
  padded?: boolean;
}

export interface IconifiedSelectProps<T> extends IconifiedSelectPropsBase<T> {
  FieldContent: OptionContentComponent<T>;
  className?: string;
  title: ReactNode;
  fieldStyle?: React.CSSProperties;
  search?: {
    placeholder?: string;
    filterItems(searchString: string): T[];
  };
}
