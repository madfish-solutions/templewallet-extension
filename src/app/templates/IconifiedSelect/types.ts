import { ComponentType } from 'react';

import { TestIDProperty } from 'lib/analytics';

export type IconifiedSelectOptionRenderProps<T> = {
  option: T;
  index?: number;
};

type OptionContentComponent<T> = ComponentType<IconifiedSelectOptionRenderProps<T>>;

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

export interface IconifiedSelectProps<T> extends IconifiedSelectPropsBase<T>, TestIDProperty {
  FieldContent: OptionContentComponent<T>;
  BeforeContent?: ComponentType<{ opened: boolean }>;
  className?: string;
  fieldStyle?: React.CSSProperties;
  search?: {
    placeholder?: string;
    filterItems(searchString: string): T[];
    inputTestID?: string;
  };
}
